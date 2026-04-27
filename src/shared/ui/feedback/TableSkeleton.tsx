import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { FC } from "react";

/**
 * Generic skeleton for tables.
 * @param rows Number of rows to display.
 * @param columns Number of columns.
 * @param header Optional header skeleton.
 */
export const TableSkeleton: FC<{
  rows?: number;
  columns?: number;
  header?: boolean;
}> = ({ rows = 5, columns = 5, header = true }) => (
  <TableContainer>
    <Table>
      {header && (
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableCell key={i}>
                <Skeleton variant="text" width="80%" />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      )}
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: columns }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton variant="rectangular" height={20} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default TableSkeleton;
