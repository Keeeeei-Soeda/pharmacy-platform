// APIレスポンスを snake_case -> camelCase に変換する共通ミドルウェア
// 方針:
// - DB/Prisma（内部）は snake_case
// - APIレスポンス（外部）は camelCase
// - 変換は1箇所（res.json）に集約する

function toCamelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value.constructor === Object || Object.getPrototypeOf(value) === null)
  );
}

function toCamelCaseDeep(value) {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseDeep);
  }

  // Dateなどはそのまま
  if (!isPlainObject(value)) {
    return value;
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[toCamelKey(k)] = toCamelCaseDeep(v);
  }
  return out;
}

function responseCaseMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    // エラーオブジェクトやプリミティブも含め、可能な範囲で変換
    return originalJson(toCamelCaseDeep(data));
  };

  next();
}

module.exports = {
  responseCaseMiddleware,
  toCamelCaseDeep
};


