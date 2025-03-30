const Query = (type, interval) => {
	console.log({ interval });

	if (type === 'ALL') {
		return `SELECT 
            uuid,
            event,
            distinct_id,
            properties.$pathname AS pathname,
            properties AS properties,
            properties.$host AS host,
            properties.providerTapped AS provider_tapped,
            properties.$referrer AS referrer,
            properties.$geoip_city_name AS city,
            properties.$geoip_country_name AS country,
            properties.$current_url AS current_url,
            timestamp
        FROM events
        WHERE
            event IN ('PROVIDER-ClICK-V2', 'PAGE-VIEW-V2')
            AND timestamp >= NOW() - INTERVAL 30 SECOND
        ORDER BY timestamp DESC`;
	} else if (type === 'USER_SPECIFIC') {
		return `SELECT 
            uuid,
            event,
            distinct_id,
            properties.$pathname AS pathname,
            properties AS properties,
            properties.$host AS host,
            properties.providerTapped AS provider_tapped,
            properties.$referrer AS referrer,
            properties.$geoip_city_name AS city,
            properties.$geoip_country_name AS country,
            properties.$current_url AS current_url,
            timestamp
        FROM events
        WHERE
            event IN ('PROVIDER-ClICK-V2', 'PAGE-VIEW-V2')
            AND 
            AND timestamp >= NOW() - ${interval || 'INTERVAL 1 MONTH'}
        ORDER BY timestamp DESC`;
	}
};
module.exports = Query;
