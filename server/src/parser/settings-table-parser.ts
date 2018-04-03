import * as _ from "lodash";

import * as positionHelper from "./position-helper";
import { decomposeKeywords } from "./composite-keywords-parser";
import { TableRowIterator } from "./row-iterator";
import {
  DataCell,
  DataTable,
  DataRow
} from "./table-models";

import {
  Identifier,
  EmptyNode,
  SettingsTable,
  LibraryImport,
  ResourceImport,
  VariableImport,
  SuiteSetting
} from "./models";

import {
  parseIdentifier,
  parseValueExpression,
  parseCallExpression,
} from "./primitive-parsers";

const settingParserMap = new Map([
  ["Library",        parseLibraryImport],
  ["Resource",       parseResourceImport],
  ["Variables",      parseVariableImport],
  ["Suite Setup",    createParseSettingFn("suiteSetup")],
  ["Suite Teardown", createParseSettingFn("suiteTeardown")],
  ["Test Setup",     createParseSettingFn("testSetup")],
  ["Test Teardown",  createParseSettingFn("testTeardown")],
]);

/**
 * Parses given table as settings table
 */
export function parseSettingsTable(dataTable: DataTable): SettingsTable {
  const settingsTable = new SettingsTable(dataTable.location);

  const iterator = new TableRowIterator(dataTable);
  while (!iterator.isDone()) {
    let row = iterator.takeRow();
    if (row.isEmpty()) {
      continue;
    }

    const continuedRows = iterator.takeRowWhile(rowContinues);
    const continuedCells = joinRows(continuedRows);
    const [firstCell, ...restCells] = row.cells.concat(continuedCells);

    const parseRowFn = getParserFn(firstCell);
    parseRowFn(settingsTable, firstCell, restCells);
  }

  return settingsTable;
}

function rowContinues(row: DataRow) {
  return row.isRowContinuation({
    requireFirstEmpty: false
  });
}

function joinRows(rows: DataRow[]): DataCell[] {
  const shouldTakeCell = cell => !cell.isRowContinuation();

  return rows.reduce((allCells, row) => {
    const rowCells = _.takeRightWhile(row.cells, shouldTakeCell);

    return allCells.concat(rowCells);
  }, []);
}

function getParserFn(cell: DataCell) {
  const name = cell.content;

  const parser = settingParserMap.get(name);

  return parser || _.noop;
}

function parseLibraryImport(settingsTable: SettingsTable, firstCell: DataCell, restCells: DataCell[]) {
  const [firstDataCell, ...restDataCells] = restCells;
  const target = parseValueExpression(firstDataCell);
  const args   = restDataCells.map(parseValueExpression);

  // TODO: WITH NAME keyword
  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(firstCell.location, lastCell.location);

  const libImport = new LibraryImport(target, args, location);
  settingsTable.addLibraryImport(libImport);
}

function parseResourceImport(settingsTable: SettingsTable, firstCell: DataCell, restCells: DataCell[]) {
  const [firstDataCell, ...restDataCells] = restCells;
  const target = parseValueExpression(firstDataCell);

  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(firstCell.location, lastCell.location);

  const resourceImport = new ResourceImport(target, location);
  settingsTable.addResourceImport(resourceImport);
}

function parseVariableImport(settingsTable: SettingsTable, firstCell: DataCell, restCells: DataCell[]) {
  const [firstDataCell, ...restDataCells] = restCells;
  const target = parseValueExpression(firstDataCell);

  const lastCell = _.last(restCells) || firstCell;
  const location = positionHelper.locationFromStartEnd(firstCell.location, lastCell.location);

  const variableImport = new VariableImport(target, location);
  settingsTable.addVariableImport(variableImport);
}

function createParseSettingFn(propertyName) {
  return (settingsTable: SettingsTable, nameCell: DataCell, valueCells: DataCell[]) => {
    const lastCell = _.last(valueCells) || nameCell;
    const location = positionHelper.locationFromStartEnd(nameCell.location, lastCell.location);
    const name = parseIdentifier(nameCell);
    let setting = new SuiteSetting(name, new EmptyNode(nameCell.location.end), location);

    if (!_.isEmpty(valueCells)) {
      let callExpressionArray = decomposeKeywords(valueCells);
      setting = new SuiteSetting(name, callExpressionArray, location);
    }

    settingsTable[propertyName] = setting;
  };
}
