const axios = require('axios');
const { fireStore } = require('../../../config/firestore');

const {
	SPOTIFY_CLIENT_ID,
	SPOTIFY_CLIENT_SECRET,
	SPOTIFY_TOKEN_URL,
	SPOTIFY_USER_PROFILE_URL,
	SPOTIFY_REDIRECT_URI,
	SPOTIFY_REFRESH_TOKEN_URL,
	USER_FRONTEND_URL,
} = process.env;

const callbackController = async (req, res) => {
	const { code, state } = req.query;
	console.log('this is from spotify to backend', { code, state });

	// Decode the state (which will contain the presaveID)
	const presaveID = state ? decodeURIComponent(state) : null;

	if (!code) {
		return res.status(400).send('Authorization failed!');
	}

	try {
		// Step 1: Get the access token using the authorization code
		const tokenResponse = await axios.post(
			SPOTIFY_TOKEN_URL,
			new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: SPOTIFY_REDIRECT_URI,
				client_id: SPOTIFY_CLIENT_ID,
				client_secret: SPOTIFY_CLIENT_SECRET,
			}).toString(),
			{
				headers: {
					'Content-Type':
						'application/x-www-form-urlencoded',
				},
			}
		);

		console.log(tokenResponse.data);

		const { access_token, refresh_token, expires_in } =
			tokenResponse.data;

		// Step 2: Fetch user profile from Spotify
		const userResponse = await axios.get(SPOTIFY_USER_PROFILE_URL, {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		const user = userResponse.data;

		// Step 3: Check if user already exists in the database
		const userRef = fireStore.collection('fans').doc(user.id);
		const userDoc = await userRef.get();

		// Prepare user data
		const userData = {
			userId: user.id,
			username: user.display_name || user.id,
			email: user.email,
			spotify: {
				spotifyID: user.id,
				accessToken: access_token,
				refreshToken: refresh_token,
				profileUrl: user.external_urls.spotify,
				imageUrl:
					user.images.length > 0
						? user.images[0].url
						: null,
			},
		};

		if (userDoc.exists) {
			// If user already exists, just update the access token and refresh token
			await userRef.update({
				'spotify.accessToken': access_token,
				'spotify.refreshToken': refresh_token, // Save the refresh token as well
				'spotify.tokenExpiresAt':
					Date.now() + expires_in * 1000, // Store expiration time
			});
			console.log('User tokens updated.');
		} else {
			// If user does not exist, save the entire user data
			await userRef.set({
				...userData,
				'spotify.tokenExpiresAt':
					Date.now() + expires_in * 1000, // Store expiration time
			});
			console.log('User data saved.');
		}

		// Step 4: Redirect the user back to the frontend with the access token
		res.redirect(
			`${USER_FRONTEND_URL}/${presaveID}?access_token=${access_token}`
		);
	} catch (error) {
		console.error(error.message);
		res.status(500).send('Authentication failed!');
	}
};

const refreshTokenController = async userId => {
	try {
		// Get user data from Firestore
		const userRef = fireStore.collection('fans').doc(userId);
		const userDoc = await userRef.get();
		if (!userDoc.exists) {
			console.log('User not found!');
			return;
		}

		const userData = userDoc.data();
		const { refreshToken, tokenExpiresAt } = userData.spotify;

		// Only refresh token if it is about to expire
		if (Date.now() > tokenExpiresAt - 60000) {
			// Refresh 1 minute before expiration
			console.log(
				'Refreshing access token for user:',
				userId
			);

			const refreshResponse = await axios.post(
				SPOTIFY_REFRESH_TOKEN_URL,
				new URLSearchParams({
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: SPOTIFY_CLIENT_ID,
					client_secret: SPOTIFY_CLIENT_SECRET,
				}).toString(),
				{
					headers: {
						'Content-Type':
							'application/x-www-form-urlencoded',
					},
				}
			);

			const {
				access_token: newAccessToken,
				refresh_token: newRefreshToken,
			} = refreshResponse.data;

			// Update both the access token and refresh token in Firebase
			await userRef.update({
				'spotify.accessToken': newAccessToken,
				'spotify.refreshToken': newRefreshToken, // Update the refresh token
				'spotify.tokenExpiresAt':
					Date.now() + 3000 * 1000, // Reset expiration time
			});

			console.log(
				'Access token and refresh token refreshed.'
			);
		}
	} catch (error) {
		console.error('Error refreshing access token:', error.message);
	}
};

// Set up the mechanism to refresh token periodically (for all users or specific user)
const startTokenRefresh = () => {
	setInterval(async () => {
		// This could be iterating over all users or you could target specific users
		const usersSnapshot = await fireStore.collection('fans').get();
		usersSnapshot.forEach(doc => {
			refreshTokenController(doc.id);
		});
	}, 60000); // Check every 1 minute
};

module.exports = {
	refreshTokenController,
	startTokenRefresh,
	callbackController,
};
