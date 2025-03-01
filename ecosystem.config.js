module.exports = {
	apps: [
		{
			name: 'my-backend-app',
			script: 'index.js', // Replace with your main file
			instances: 'max', // Number of instances to run (max for clustering)
			exec_mode: 'cluster', // Use cluster mode for better performance
			watch: true, // Enable watching for file changes (optional)
			env_production: {
				NODE_ENV: 'production',
			},
			env_development: {
				NODE_ENV: 'development',
			},
		},
	],
};
