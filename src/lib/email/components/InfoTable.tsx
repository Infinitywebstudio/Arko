import { Section } from "react-email";
import { colors } from "@/lib/email/theme";

export interface InfoRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface InfoTableProps {
  rows: InfoRow[];
}

/**
 * Two-column label/value table used to summarise a booking (when / where /
 * options / payout). Rendered as a real <table> because email clients are
 * far more reliable with tables than with flex/grid.
 */
export function InfoTable({ rows }: InfoTableProps) {
  return (
    <Section style={{ margin: "20px 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td
                style={{
                  padding: "6px 12px 6px 0",
                  color: colors.muted,
                  whiteSpace: "nowrap",
                  verticalAlign: "top",
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontWeight: row.emphasis ? 700 : 600,
                  color: row.emphasis ? colors.primary : colors.text,
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
