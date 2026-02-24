import { Observer } from "../../../utils/observer";
import { PropsWithChildren, ReactNode, RefObject } from "react";
import { DataGetterFetchType } from "../../DataGetter/meta/types";

/* =========================================================
   Generic Column & Row Types
========================================================= */

export interface ITableFilterProps<T = unknown> {
  onChange: (value: T) => void;
  value: T;
}

export interface ITableColumnMeta {
  openEdit: () => void;
  closeEdit: () => void;
  isEditMode: boolean;
  submit?: () => void;
  isCreate?: boolean;
  index?: number;
  treeTable?: {
    toggle: () => void;
    isOpen?: boolean;
  };
}

/* =========================================================
   Column Definition (Generic)
========================================================= */

export interface ITableColumn<T = unknown> {
  title: string;
  field: keyof T & string;

  render?: (
    value: T[keyof T],
    row: T,
    meta?: Partial<ITableColumnMeta>
  ) => ReactNode;

  renderField?: (
    value: T[keyof T],
    row: T,
    meta?: ITableColumnMeta,
    values?: Partial<T>
  ) => ReactNode;

  renderColumn?: () => ReactNode;

  filter?: (props: ITableFilterProps) => ReactNode;
  filterName?: string;

  display?: boolean;
  displayInSelectColumns?: boolean;

  position?: number;
  order?: string;

  hasSort?: boolean;
  fixed?: boolean;
  fixedFromEnd?: boolean;

  width?: number | string;
  autoWidth?: boolean;

  textClassName?: string;
  thClassName?: string;
  tdClassName?: string;

  tooltipWidth?: number;
  hasTooltip?: boolean;

  hasDateFormatter?: boolean;
  dateFormat?: string;

  hasDash?: boolean;
  hasStar?: boolean;

  textLimit?: number;

  isAction?: boolean;

  children?: ITableColumn<T>[];
}

/* =========================================================
   Row Props (Generic)
========================================================= */

export interface ITableRowProps<T = unknown> {
  data: T;
  index: number;
  columns: ITableColumn<T>[];
  isCreate?: boolean;
  className?: string;
}

/* =========================================================
   Context Types
========================================================= */

export interface TableContextProps<T = unknown> {
  tableContainerRef?: RefObject<HTMLDivElement>;

  displayFilter: boolean;
  setDisplayFilter: (display: boolean) => void;

  hasFilter: boolean;

  onRowClick?: (row: T) => void;
  selectedRow?: T;

  observer: Observer;

  getKey: (row: T) => string | number;

  firstColumnIndex?: number;
  lastColumnIndex?: number;
  displayingColumnsLength?: number;

  actionColumn?: ITableColumn<T>;

  firstHeaderColumnIndex?: number;
  lastHeaderColumnIndex?: number;

  isDoubleLayer?: boolean;
}

export interface ITableOrderContext {
  activeOrder?: string;
  orderDirection?: "ASC" | "DESC";
  setActiveOrder: (
    order: string,
    direction: "ASC" | "DESC"
  ) => void;
}

export interface ITableFilterContext<T = unknown> {
  onFilterChange: (value: Partial<T>) => void;
  filters: Partial<T>;
  displayFilter: boolean;
  clearFilters?: () => void;
}

/* =========================================================
   Fixed Columns Context
========================================================= */

export interface TableFixedColumnsContextValues {
  headerPositionState?: unknown;
  calculateCellsWidth?: () => void;
  setTableHeaderRowRef?: (
    ref: HTMLTableRowElement | null
  ) => void;
  addTableRowRef?: (
    row: HTMLTableRowElement | null
  ) => void;
  removeTableRowRef?: (id: string | number) => void;
  setFixedCellsPositionForTableRow?: (
    row: HTMLTableRowElement | null
  ) => void;
}

export interface FixedColumnsProviderProps<T = unknown>
  extends PropsWithChildren {
  columns?: ITableColumn<T>[];
  hasActionColumn?: boolean;
  disabled?: boolean;
}

/* =========================================================
   Footer Types
========================================================= */

export interface ITableFooterProps<T = unknown> {
  columns?: ITableColumn<T>[];
}

export interface ITableFooterCellProps<T = unknown> {
  column: ITableColumn<T>;
  getColumnDropdownType: DataGetterFetchType;
  getOptionFilter: DataGetterFetchType;
  isFixed?: boolean;
}
