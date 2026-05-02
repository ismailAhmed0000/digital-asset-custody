/**
 * DB schema may still enforce CHECK (type IN ('individual','business')).
 * API uses retail / institutional — map at the boundary.
 */

function toDbType(apiType) {
  if (apiType === 'retail') return 'individual';
  if (apiType === 'institutional') return 'business';
  return null;
}

function toApiType(dbType) {
  if (dbType === 'individual') return 'retail';
  if (dbType === 'business') return 'institutional';
  return dbType;
}

/** SQL fragment: DB column -> API type alias (use in SELECT lists). */
function apiTypeCaseSql(column = 'type') {
  return `CASE ${column} WHEN 'individual' THEN 'retail' WHEN 'business' THEN 'institutional' ELSE ${column} END AS type`;
}

module.exports = { toDbType, toApiType, apiTypeCaseSql };
