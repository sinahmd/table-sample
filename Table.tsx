import {
    ComponentType,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from "react";
import {
    ITableColumn,
    ITableFilterContext,
    ITableOrderContext,
    ITableRowProps,
    TableContextProps,
} from "./meta/types";
import {
    TableContext,
    TableFilterContext,
    TableOrderContext,
} from "./context/TableContext";
import {
    convertColumnsToDisplayMap,
    getColumnUniqueId,
    getTableDefaultKey,
    makeTableResizable,
} from "./utils/utils";
import "./assets/Table.scss";
import Button from "../../components/Button/Button";
import TableBody from "./components/TableBody";
import TableDefaultRow from "./components/TableDefaultRow";
import TableError from "./components/TableError";
import TableFixedColumnsProvider from "./components/TableFixedColumnsProvider";
import TableHeader from "./components/TableHeader";
import TableNoData from "./components/TableNoData";
import TableNoDataInplace from "./components/TableNoDataInplace";
import TablePagination from "./components/TablePagination";
import classNames from "classnames";
import useTableCardContext from "../TableCard/hooks/useTableCardContext";
import { HEADER_AND_OTHER_OF_TABLE_HEIGHT, ONE_TABLE_ROW_HEIGHT, ON_ROW_CREATED_SUCCESSFULY } from "./meta/constants";
import { ListContext } from "../../container/ListContainer/context/ListContext";
import { Observer } from "../../utils/observer";
import { OfflineInplaceEdditingContext } from "../../container/OfflineInplaceEdditing/context/OfflineInplaceEdditingContext";
import { TABLE_ROWS_MARGIN } from "../RowEditing/meta/constants";
import { defineMessages, FormattedMessage, useIntl } from "react-intl";
import { useListColumnSelection } from "../../context/ListColumnSelectionContext";
import { useMemo, useState } from "react";
import { useUiMode } from "../../container/ConfigProvider/ConfigProvider";
import isEqual from "react-fast-compare";
import { showValueWithSeparator } from "../../utils/utilities";

const messages = defineMessages({
    reload: {
        id: "reload",
        defaultMessage: "reload",
    },
    footerRowsDisplay: {
        id: 'display-first-number-to-last-number-of-total-values-rows',
        defaultMessage: 'display-first-number-to-last-number-of-total-values-rows'
    }
});

export interface TableProps {
    columns: ITableColumn[];
    data: any;
    hasSelectRow?: boolean;
    rowComponent?: ComponentType<ITableRowProps>,
    className?: string;
    orderDirection?: 'DESC' | 'ASC';
    orderBy?: string;
    idField?: string;
    hasColumnSelection?: boolean;
    hasFilter?: boolean;
    onFilterChange?: (filters?: any) => void;
    onOrderChange?: (order?: string, direction?: string) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    loading?: boolean;
    error?: string;
    totalItems?: number;
    filters?: any;
    page?: number;
    refresh?: () => void;
    clearFilters?: () => void;
    errorHandler?: (error: any) => string;
    statusCode?: number;
    onRowClick?: (row: any) => void;
    selectedRow?: any;
    isComboboxTable?: boolean;
    pageSize?: number;
    hasFooterRefresh?: boolean;
    hasPaginator?: boolean;
    isInPlaceCreate?: boolean;
    hasRowData?: boolean;
    footerRow?: ReactNode;
    getRowClassName?: (row: any) => string;
    displayTotalItems?: boolean
    getKey?: (row: any) => any;
    tableNoData?: ReactNode;
    hasFixedColumns?: boolean;
    configColumnsToColumnSelection?: boolean;
    multiHeader?: any;
    getTableWidth?: (activeColumns: ITableColumn[]) => number;
    resizeable?: boolean;
    showActionRow?: boolean;
    needFinancialCode?: boolean;
    hasStatistics?: boolean
}

function Table({
    columns: defaultColumns,
    data,
    hasSelectRow = false,
    rowComponent: RowComponent = TableDefaultRow,
    className,
    orderDirection,
    orderBy: order,
    idField,
    hasFilter = false,
    onOrderChange,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    error,
    loading,
    totalItems = 0,
    filters,
    page,
    refresh,
    clearFilters,
    errorHandler,
    onRowClick,
    selectedRow,
    isComboboxTable: isTableCombobox,
    pageSize = isTableCombobox ? 5 : 10,
    hasFooterRefresh = false,
    hasPaginator = true,
    isInPlaceCreate,
    hasRowData,
    footerRow,
    getRowClassName,
    displayTotalItems = true,
    getKey = getTableDefaultKey,
    tableNoData = RowComponent !== TableDefaultRow ? <TableNoDataInplace /> : <TableNoData />,
    hasFixedColumns,
    configColumnsToColumnSelection,
    multiHeader,
    getTableWidth,
    resizeable: isResizableTable,
    showActionRow = true,
    needFinancialCode,
    hasStatistics = false,
}: TableProps): ReactElement {
    const uiMode = useUiMode();

    const intl = useIntl();

    const observer = useRef(new Observer());

    const tableRef = useRef<any>();

    const tableContainerRef = useRef<HTMLDivElement>(null);

    const hasSetColumns = useRef(false);

    const resizeable = !!multiHeader?.length ? false : (isResizableTable);

    const previousColumns = useRef<any>(defaultColumns)

    const firstValue = (page ?? 0) * pageSize + 1

    const lastValue = ((page ?? 0) + 1) * pageSize;

    const {
        displayMap,
        onDisplayMapChange,
        defaultColumnSelectionValue,
        columns: orderedColumns,
        initializeColumns,
    } = useListColumnSelection();

    const isMainList = useTableCardContext();

    const { isActive: isOnlineList } = useContext(ListContext);

    const { isActive: isOfflineList } = useContext(OfflineInplaceEdditingContext);


    const [displayFilter, setDisplayFilter] = useState<boolean>(false);

    const actionColumn = useMemo(() => {
        if (
            !showActionRow ||
            RowComponent !== TableDefaultRow ||
            !defaultColumns?.length
        ) {
            return;
        }

        const lastColumn = defaultColumns[defaultColumns.length - 1];

        return lastColumn?.field === "id" ? lastColumn : undefined;
    }, [showActionRow, RowComponent, defaultColumns]);

    const useColumnSelectionState = (
        configColumnsToColumnSelection ??
        (isMainList || RowComponent === TableDefaultRow)
    );

    const activeColumns = useMemo(() => {
        if (useColumnSelectionState && orderedColumns?.length && isEqual(previousColumns.current, defaultColumns)) {
            return orderedColumns;
        }

        return actionColumn ? defaultColumns.slice(0, -1) : defaultColumns;
    }, [useColumnSelectionState, orderedColumns, actionColumn, defaultColumns]);

    const columns = useMemo<any>(() => {
        if (!isOfflineList) return activeColumns;

        return activeColumns?.map((column) => ({ ...column, hasSort: false }));
    }, [isOfflineList, isOnlineList, activeColumns]);

    useEffect(() => {
        if (hasSetColumns.current) {
            if (resizeable) {
                makeTableResizable(tableRef.current)
            }
            return;
        };

        hasSetColumns.current = true;

        if (!useColumnSelectionState) return;

        const finalColumns = activeColumns.map((column) => ({
            ...column,
            displayInSelectColumns: column.displayInSelectColumns ?? true,
            display: column.display ?? true,
        }));

        initializeColumns(finalColumns);

        if (defaultColumnSelectionValue) {
            onDisplayMapChange(defaultColumnSelectionValue);
            return;
        }

        if (Object.values(displayMap).length === 0) {
            onDisplayMapChange(convertColumnsToDisplayMap(finalColumns));
        }
    }, [activeColumns, onDisplayMapChange, initializeColumns]);

    const handleSortChange = useCallback(
        (order: string, direction: 'DESC' | 'ASC') => {
            onOrderChange && onOrderChange(order, direction);
        },
        [onOrderChange]
    );

    const handleFilterChange = useCallback(
        (filters: any) => {
            onFilterChange && onFilterChange(filters);
        },
        [onFilterChange]
    );

    const [firstColumnIndex, lastColumnIndex, dispalyingColumnsLength] = useMemo(() => {
        const activeColumnsWithChildren = activeColumns.reduce<ITableColumn[]>((total, column) => {
            if (column.children)
                return total.concat(column.children);
            else
                return total.concat(column)
        }, [])

        if (Object.values(displayMap).length === 0) {
            return [0, activeColumnsWithChildren?.length - 1, activeColumnsWithChildren?.length];
        }

        let firstColumnIndex: number | undefined = undefined;
        let lastColumnIndex: number | undefined = undefined;
        let dispalyingColumnsLength: number = 0;

        activeColumnsWithChildren?.forEach((column, index) => {
            // filter only displaying columns
            if (displayMap[getColumnUniqueId(column)] === false) {
                return;
            }

            if (firstColumnIndex === undefined) {
                // first column wich display is true
                firstColumnIndex = index;
            }
            // last column wich display is true
            lastColumnIndex = index;

            dispalyingColumnsLength += 1;
        });

        return [firstColumnIndex, lastColumnIndex, dispalyingColumnsLength];
    }, [activeColumns, displayMap]);

    const [firstHeaderColumnIndex, lastHeaderColumnIndex] = useMemo(() => {
        if (Object.values(displayMap).length === 0) {
            return [0, activeColumns?.length - 1, activeColumns?.length];
        }

        let firstColumnIndex: number | undefined = undefined;
        let lastColumnIndex: number | undefined = undefined;

        activeColumns?.forEach((column, index) => {
            // filter only displaying columns
            if (displayMap[getColumnUniqueId(column)] === false) {
                return;
            }

            if (firstColumnIndex === undefined) {
                // first column wich display is true
                firstColumnIndex = index;
            }
            // last column wich display is true
            lastColumnIndex = index;
        });

        return [firstColumnIndex, lastColumnIndex];
    }, [activeColumns, displayMap]);

    const isDoubleLayer = useMemo(() => {
        return activeColumns.some(item => Boolean(item.children?.length))
    }, [activeColumns])

    const tableContextValue = useMemo<TableContextProps>(() => ({
        displayFilter,
        setDisplayFilter,
        hasFilter,
        onRowClick,
        selectedRow,
        observer: observer.current,
        getKey,
        actionColumn,
        firstColumnIndex,
        lastColumnIndex,
        dispalyingColumnsLength,
        tableContainerRef,
        firstHeaderColumnIndex,
        lastHeaderColumnIndex,
        isDoubleLayer,
    }), [
        displayFilter,
        hasFilter,
        onRowClick,
        selectedRow,
        hasFilter,
        firstColumnIndex,
        lastColumnIndex,
        dispalyingColumnsLength,
        isDoubleLayer
    ]);

    const tableOrderContextValue = useMemo<ITableOrderContext>(
        () => ({
            setActiveOrder: handleSortChange,
            activeOrder: order,
            orderDirection
        }),
        [handleSortChange, order, orderDirection]
    );

    const tableFilterContextValue: ITableFilterContext = useMemo(
        () => ({
            filters,
            onFilterChange: handleFilterChange,
            displayFilter,
            clearFilters,
        }),
        [filters, handleFilterChange, displayFilter, clearFilters]
    );

    useEffect(() => {
        const cb = () => {
            tableContainerRef.current?.scroll({ top: 0, left: 0, behavior: "smooth" });
        }

        observer.current.on(ON_ROW_CREATED_SUCCESSFULY, cb);

        return () => observer.current.off(cb);
    }, []);

    return (
        <TableFilterContext.Provider value={tableFilterContextValue}>
            <TableOrderContext.Provider value={tableOrderContextValue}>
                <TableContext.Provider value={tableContextValue}>
                    <TableFixedColumnsProvider
                        columns={columns}
                        hasActionColumn={Boolean(actionColumn)}
                        disabled={typeof hasFixedColumns === "boolean" ? !hasFixedColumns : !isMainList}
                    >
                        <div
                            ref={tableContainerRef}
                            style={{
                                height: isDoubleLayer ? HEADER_AND_OTHER_OF_TABLE_HEIGHT + (ONE_TABLE_ROW_HEIGHT + TABLE_ROWS_MARGIN) : undefined,
                                minHeight: isDoubleLayer ? HEADER_AND_OTHER_OF_TABLE_HEIGHT + (ONE_TABLE_ROW_HEIGHT + TABLE_ROWS_MARGIN) * data?.length : undefined,
                            }} // f(x) = 56x + 111 by default
                            className={classNames("table-container d-block", className, {
                                'is-combobox': isTableCombobox,
                                'table-has-scroll': isTableCombobox && data?.length,
                                'has-row-data': hasRowData,
                                'loading-or-error': error || loading,
                            })}
                        >
                            {!loading && error && (
                                <div className="error-container">
                                    <TableError error={error} errorHandler={errorHandler} needFinancialCode={needFinancialCode}/>
                                </div>
                            )}

                            <table
                                ref={tableRef}
                                style={{ width: getTableWidth?.(columns) }}
                                className={classNames("table-style", {
                                    "is-fixed-column-table": hasFixedColumns,
                                    "resizer-border": resizeable,
                                    'is-table-double-layer': isDoubleLayer,
                                    "has-table-auto-layout": !!multiHeader?.length
                                })}
                            >
                                <TableHeader
                                    columns={columns}
                                    hasSelectRow={hasSelectRow}
                                    multiHeader={multiHeader}
                                />

                                <TableBody
                                    columns={columns}
                                    idField={idField}
                                    getRowClassName={getRowClassName}
                                    rowComponent={RowComponent}
                                    isInPlaceCreate={isInPlaceCreate}
                                    footerRow={footerRow}
                                    loading={loading}
                                    tableNoData={tableNoData}
                                    data={data}
                                    hasError={Boolean(error)}
                                    tableError={<TableError error={error} errorHandler={errorHandler} needFinancialCode={needFinancialCode} />}
                                    hasStatistics={hasStatistics}
                                />
                            </table>
                        </div>

                        {hasPaginator && (
                            <div className="table-footer d-flex">
                                {displayTotalItems && totalItems !== undefined && totalItems !== null && (
                                    <span className="page-info my-auto d-block mr-2">
                                        <FormattedMessage
                                            id="rows-number"
                                            defaultMessage="rows-number"
                                        /> {': '}
                                        {totalItems}
                                    </span>
                                )}

                                <div className="flex-grow-1 rtl d-flex justify-content-center table-footer-pagination">
                                    <TablePagination
                                        isTableCombobox={isTableCombobox}
                                        onPageChange={onPageChange}
                                        onPageSizeChange={onPageSizeChange}
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={totalItems}
                                    />
                                </div>

                                {displayTotalItems && totalItems !== undefined && totalItems !== null && (
                                    <span className="page-info my-auto d-block mr-2">
                                        {intl.formatMessage(messages.footerRowsDisplay, { firstValue: showValueWithSeparator(firstValue), lastValue: showValueWithSeparator(lastValue < totalItems ? lastValue : totalItems), totalItems: showValueWithSeparator(totalItems) })}
                                    </span>
                                )}

                                {hasFooterRefresh && refresh && (
                                    <Button
                                        type="button"
                                        color="yellow"
                                        tooltip={intl.formatMessage(messages.reload)}
                                        left={<i className="agin-icon-refresh" style={{ fontSize: 15 }} />}
                                        className="ml-2 action-btn" onClick={() => refresh()}
                                        circle
                                    />
                                )}
                            </div>
                        )}
                    </TableFixedColumnsProvider>
                </TableContext.Provider>
            </TableOrderContext.Provider>
        </TableFilterContext.Provider>
    )
}

export default Table;
