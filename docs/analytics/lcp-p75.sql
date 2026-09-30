-- GoogleSQL. Run after the first GA4 daily export creates events_YYYYMMDD.
-- Seven date suffixes ending yesterday UTC; use explicit YYYYMMDD bounds for release comparisons.
-- Suffixes follow the GA property's reporting dates, not navigation start times.
-- This is RUM for consenting GA visitors, not the Chrome/CrUX population.
WITH source AS (
  SELECT event_timestamp, stream_id, user_pseudo_id, event_params,
    device.category AS device_category, geo.country AS country
  FROM `avalon-web-vitals.analytics_430786828.events_*`
  WHERE _TABLE_SUFFIX BETWEEN
    FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE('UTC'), INTERVAL 7 DAY))
    AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE('UTC'), INTERVAL 1 DAY))
    AND event_name = 'web_vital'
), extracted AS (
  SELECT event_timestamp, stream_id, user_pseudo_id, device_category, country,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'metric_name') AS metric_name,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'metric_id') AS metric_id,
    (SELECT COALESCE(value.int_value, SAFE_CAST(value.string_value AS INT64))
      FROM UNNEST(event_params) WHERE key = 'metric_sequence') AS metric_sequence,
    (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64),
      SAFE_CAST(value.string_value AS FLOAT64)) FROM UNNEST(event_params) WHERE key = 'metric_value') AS lcp_ms,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'app_version') AS app_version,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_route') AS page_route,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_locale') AS page_locale,
    (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
      FROM UNNEST(event_params) WHERE key = 'ttfb_ms') AS ttfb_ms,
    (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
      FROM UNNEST(event_params) WHERE key = 'load_delay_ms') AS load_delay_ms,
    (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
      FROM UNNEST(event_params) WHERE key = 'load_duration_ms') AS load_duration_ms,
    (SELECT COALESCE(value.double_value, value.float_value, CAST(value.int_value AS FLOAT64))
      FROM UNNEST(event_params) WHERE key = 'render_delay_ms') AS render_delay_ms
  FROM source
), latest AS (
  -- Keep the latest update, not the maximum LCP. Never register metric_id as a GA dimension.
  SELECT * FROM extracted
  WHERE metric_name = 'LCP' AND NULLIF(metric_id, '') IS NOT NULL
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY stream_id, user_pseudo_id, metric_id
    ORDER BY COALESCE(metric_sequence, 0) DESC, event_timestamp DESC
  ) = 1
), segmented AS (
  SELECT latest.*, segment.scope, segment.segment
  FROM latest CROSS JOIN UNNEST([
    STRUCT('overall' AS scope, 'all' AS segment),
    STRUCT('version', COALESCE(app_version, '(missing)')),
    STRUCT('device', COALESCE(device_category, '(missing)')),
    STRUCT('country', COALESCE(country, '(missing)')),
    STRUCT('route', COALESCE(page_route, '(missing)')),
    STRUCT('locale', COALESCE(page_locale, '(missing)')),
    STRUCT('version_device', CONCAT(COALESCE(app_version, '(missing)'), ' / ', COALESCE(device_category, '(missing)')))
  ]) AS segment
  WHERE lcp_ms >= 0 AND NOT IS_NAN(lcp_ms) AND NOT IS_INF(lcp_ms)
), percentiles AS (
  SELECT *, PERCENTILE_CONT(lcp_ms, 0.75) OVER (PARTITION BY scope, segment) AS p75_lcp_ms
  FROM segmented
)
SELECT scope, segment, COUNT(*) AS measurements,
  COUNT(DISTINCT user_pseudo_id) AS identified_users,
  COUNTIF(user_pseudo_id IS NULL) AS measurements_without_user_id,
  ROUND(MAX(p75_lcp_ms), 1) AS p75_lcp_ms,
  ROUND(100.0 * COUNTIF(lcp_ms <= 2500) / COUNT(*), 1) AS good_percent,
  ROUND(AVG(ttfb_ms), 1) AS mean_ttfb_ms,
  ROUND(AVG(load_delay_ms), 1) AS mean_load_delay_ms,
  ROUND(AVG(load_duration_ms), 1) AS mean_load_duration_ms,
  ROUND(AVG(render_delay_ms), 1) AS mean_render_delay_ms,
  COUNT(ttfb_ms) AS ttfb_samples,
  COUNT(render_delay_ms) AS render_delay_samples
FROM percentiles
GROUP BY scope, segment
ORDER BY scope, measurements DESC, segment;
