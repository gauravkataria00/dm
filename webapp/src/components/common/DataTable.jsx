export default function DataTable({ columns, rows, emptyMessage = "No data available" }) {
  if (!rows.length) {
    return <div className="py-8 text-center text-sm text-slate-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-slate-50">
              {columns.map((column) => (
                <td key={`${row.id || index}-${column.key}`} className="px-4 py-3 text-sm text-slate-700">
                  {typeof column.render === "function" ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}