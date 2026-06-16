import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function Pagination({ table, pagination, totalRows }) {
  const { pageIndex, pageSize } = pagination;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="pagination-container" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 1.5rem",
      borderTop: "1px solid var(--border)",
      backgroundColor: "var(--background)",
    }}>

      {/* Rows per page */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          style={{
            padding: "0.25rem 0.5rem",
            fontSize: "0.875rem",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {[5, 8, 10, 25].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {/* Range display */}
      <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        {start}–{end} of {totalRows}
      </span>

      {/* Navigation buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {[
          { icon: ChevronsLeft, action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
          { icon: ChevronLeft, action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
          { icon: ChevronRight, action: () => table.nextPage(), disabled: !table.getCanNextPage() },
          { icon: ChevronsRight, action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
        ].map(({ icon: Icon, action, disabled }, i) => (
          <button
            key={i}
            onClick={action}
            disabled={disabled}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "transparent",
              color: disabled ? "var(--muted-foreground)" : "var(--foreground)",
              opacity: disabled ? 0.4 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "var(--muted)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

    </div>
  );
}