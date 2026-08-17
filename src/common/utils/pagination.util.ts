export const createFilter = (
  search?: string,
  date?: string | Date,
  options?: { searchField?: string; dateField?: string },
): Record<string, any> => {
  const searchField = options?.searchField ?? 'name';
  const dateField   = options?.dateField   ?? 'createdAt';
  const filter: Record<string, any> = {};

  if (search?.trim()) {
    filter[searchField] = { $regex: search.trim(), $options: 'i' };
  }

  if (date) {
    const _date      = new Date(date);
    const startOfDay = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
    const endOfDay   = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate() + 1);
    filter[dateField] = { $gte: startOfDay, $lt: endOfDay };
  }

  return filter;
};

export const createMeta = (page: number, limit: number, total: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

export const createPaginationInfo = (page: number, limit: number, total: number) => ({
  currentPage:  page,
  totalPages:   Math.ceil(total / limit) || 1,
  hasNextPage:  page * limit < total,
  hasPrevPage:  page > 1,
});
