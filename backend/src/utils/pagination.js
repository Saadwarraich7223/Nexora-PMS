const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizePagination = ({
  page,
  limit,
  defaultLimit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT,
} = {}) => {
  const safePage = toPositiveInteger(page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInteger(limit, defaultLimit);
  const safeLimit = Math.min(requestedLimit, maxLimit);
  const skip = (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip,
  };
};

const buildPaginationMeta = ({ total, page, limit }) => {
  const totalItems = Number(total) || 0;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    total: totalItems,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
};

export { normalizePagination, buildPaginationMeta, DEFAULT_LIMIT, MAX_LIMIT };
