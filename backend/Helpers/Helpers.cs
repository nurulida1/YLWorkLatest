using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Helpers
{
    public static class QueryableHelper
    {
        public static IOrderedQueryable<T> ApplyOrderBy<T>(IQueryable<T> query, string orderBy)
        {
            IOrderedQueryable<T>? orderedQuery = null;

            foreach (var part in orderBy.Split(','))
            {
                var trimmed = part.Trim();
                if (string.IsNullOrWhiteSpace(trimmed)) continue;

                bool descending = trimmed.EndsWith(" desc", StringComparison.OrdinalIgnoreCase);
                var propName = descending ? trimmed[..^5].Trim() : trimmed;

                var propInfo = typeof(T).GetProperty(
                    propName,
                    System.Reflection.BindingFlags.IgnoreCase |
                    System.Reflection.BindingFlags.Public |
                    System.Reflection.BindingFlags.Instance
                );

                if (propInfo == null) continue;

                if (orderedQuery == null)
                {
                    orderedQuery = descending
    ? query.OrderByDescending(x => EF.Property<object>(x!, propInfo.Name))
    : query.OrderBy(x => EF.Property<object>(x!, propInfo.Name));
                }
                else
                {
                    orderedQuery = descending
                        ? orderedQuery.ThenByDescending(x => EF.Property<object>(x, propInfo.Name))
                        : orderedQuery.ThenBy(x => EF.Property<object>(x, propInfo.Name));
                }
            }

            return orderedQuery ?? query.OrderBy(x => 0); // fallback
        }
    }
}
