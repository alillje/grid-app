import './grid-displayer.css'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setAmountOfRows, globalSetRowGap } from '../../redux/reducers/rows'
import {
  setAmountOfColumns,
  globalSetColumnGap
} from '../../redux/reducers/columns'
import { setParentCssCode, setChildrenCssCode } from '../../redux/reducers/css-code'
import { RandomColorGenerator } from '../../classes/random-color-generator.js'
import { RowCalculator } from '../../classes/row-calculator.js'
import { ColumnCalculator } from '../../classes/column-calculator.js'
import { ChildElementCalculator } from '../../classes/child-element-calculator'
import { Validator } from '../../classes/validator.js'
import { gridlify } from '../../../node_modules/gridlify/lib/index.js'

/**
 * GridDisplayer Component.
 * Displays a grid layout and lets the user append elements dynamically.
 *
 * @returns {React.ReactElement} - GridDisplayer Component.
 */
const GridDisplayer = () => {
  const dispatch = useDispatch()
  const numberOfRows = useSelector((state) => state.rows.numberOfRows)
  const numberOfColumns = useSelector((state) => state.columns.numberOfColumns)
  const randomColorGenerator = new RandomColorGenerator()
  const rowCalculator = new RowCalculator()
  const columnCalculator = new ColumnCalculator()
  const validator = new Validator()
  const childElementCalculator = new ChildElementCalculator()
  childElementCalculator.setNumberOfChildElements(numberOfRows * numberOfColumns)
  const rowGap = useSelector((state) => state.rows.rowGap)
  const columnGap = useSelector((state) => state.columns.columnGap)
  const userHasResetGrid = useSelector((state) => state.gridReset.reset)
  const viewingCssCode = useSelector((state) => state.csscode.viewCssCode)
  const [startRow, setStartRow] = useState(0)
  const [startColumn, setStartColumn] = useState(0)
  const [templateBoxNumber, setTemplateBoxNumber] = useState(1)
  const [userIsSelectingAnArea, setUserIsSelectingAnArea] = useState(false)
  let endRow
  let endColumn

  /**
   * Sets the dimensions for the main grid area based on number of columns and rows.
   */
  const setGridDimensions = () => {
    rowCalculator.setRows(numberOfRows)
    columnCalculator.setColumns(numberOfColumns)
  }

  /**
   * Sets the parent grid element dimensions.
   */
  const setParentElementGrid = () => {
    clearGridFromChildElements()
    setGridDimensions()
    gridlify.setGrid(createGrid(), '.gridDisplayerContainer')
  }

  /**
   * Clears the grid from all children elements by calling ChildElementCalculator.
   */
  const clearGridFromChildElements = () => {
    childElementCalculator.removeChildElements('.templateBox')
  }

  /**
   * Sets positions for children elemnts by calling the Child Element Calculator.
   */
  const setPositionsForChildElementsInGridLayout = () => {
    childElementCalculator.setNumberOfChildElements(numberOfRows * numberOfColumns)
    childElementCalculator.setChildElementCoordinates(numberOfRows, numberOfColumns)
  }

  /**
   * Creates a grid object.
   *
   * @returns {object} - An object containing all grid properties.
   */
  const createGrid = () => {
    return {
      rows: rowCalculator.getRows(),
      columns: columnCalculator.getColumns(),
      rowGap,
      columnGap
    }
  }

  /**
   * Creates a position object.
   *
   * @returns {object} - An object containing all position properties.
   */
  const createPositions = () => {
    return {
      startRow,
      startColumn,
      endRow: parseInt(endRow) + 1,
      endColumn: parseInt(endColumn) + 1
    }
  }

  /**
   * Sets the start position of the html element to append.
   *
   * @param {object} event - An event object.
   */
  const setStartCoordinates = (event) => {
    if (!validator.isAlreadySelected(event.target)) {
      setUserIsSelectingAnArea(true)
      setStartRow(childElementCalculator.getStartRowPosition(event.target))
      setStartColumn(childElementCalculator.getStartColumnPosition(event.target))
    }
  }

  /**
   * Creates and appends a HTML element, representing the child element of a grid layout.
   *
   */
  const createAndAppendChildElement = () => {
    const childElement = window.document.createElement('div')
    childElement.classList.add('templateBox')
    childElement.setAttribute('id', `box${templateBoxNumber}`)
    childElement.style.backgroundColor = randomColorGenerator.getRandomColor()
    window.document.querySelector('.gridDisplayerContainer').appendChild(childElement)
  }

  /**
   * Sets the end position of the html element to append.
   *
   * @param {object} event - An event object.
   */
  const setEndCoordinates = (event) => {
    if (userIsSelectingAnArea && !validator.isAlreadySelected(event.target) && !endIsLessThanStartCoordinate(event.target)) {
      createAndAppendChildElement()
      setRowEndCoordinate(childElementCalculator.getEndRowPosition(event.target))
      setColumnEndCoordinate(childElementCalculator.getEndColumnPosition(event.target))
      gridlify.setPosition(createPositions(), `#box${templateBoxNumber}`)
      setTemplateBoxNumber(templateBoxNumber + 1)
    }
    setUserIsSelectingAnArea(false)
  }

  /**
   * Sets the end coordinate value for the row to given coordinate.
   *
   * @param {number} coordinate *
   */
  const setRowEndCoordinate = (coordinate) => {
    endRow = coordinate
  }

  /**
   * Sets the end coordinate value for the column to given coordinate.
   *
   * @param {number} coordinate *
   */
  const setColumnEndCoordinate = (coordinate) => {
    endColumn = coordinate
  }

  /**
   * Validates if start row and column coordinates are greate than end coordinates.
   *
   * @param {object} htmlElement *
   * @returns {boolean} true if start row and column are bigger than end values.
   */
  const endIsLessThanStartCoordinate = (htmlElement) => {
    const invalidRowCordinates = validator.endIsLessThanStartValue(startRow, childElementCalculator.getEndRowPosition(htmlElement))
    const invalidColumnCordinates = validator.endIsLessThanStartValue(startColumn, childElementCalculator.getEndColumnPosition(htmlElement))
    return invalidRowCordinates && invalidColumnCordinates
  }

  /**
   * Sends the CSS code representation for the parent element
   * representing the main layout area to the global state.
   */
  const sendParentCssCodeToGlobalState = () => {
    setGridDimensions()
    dispatch(
      setParentCssCode({
        parentCss: gridlify.getGridCss({ rows: rowCalculator.getRows(), columns: columnCalculator.getColumns(), rowGap, columnGap })
      })
    )
  }

  /**
   * Sends the CSS code representation for the child elements
   * representing the selected areas to the global state.
   */
  const sendChildrenCssCodeToGlobalState = () => {
    dispatch(
      setChildrenCssCode({
        childrenCss: childElementCalculator.getChildrenPositionsAsCssCode('.templateBox')
      })
    )
  }

  /**
   * Resets all grid values to their initial state.
   */
  const resetGrid = () => {
    resetNumberOfRowsInGlobalState()
    resetNumberOfColumnsInGlobalState()
    resetRowGapInGlobalState()
    resetColumnGapInGlobalState()
  }

  /**
   * Resets the numberOfRows value by dispatching/senidng
   * message to global state.
   */
  const resetNumberOfRowsInGlobalState = () => {
    dispatch(
      setAmountOfRows({
        numberOfRows: undefined
      })
    )
  }

  /**
   * Resets the numberOfRows value by dispatching/senidng
   * message to global state.
   */
  const resetNumberOfColumnsInGlobalState = () => {
    dispatch(
      setAmountOfColumns({
        numberOfColumns: undefined
      })
    )
  }

  /**
   * Resets the rowGap value by dispatching/senidng
   * message to global state.
   */
  const resetRowGapInGlobalState = () => {
    dispatch(
      globalSetRowGap({
        rowGap: undefined
      })
    )
  }

  /**
   * Resets the columnGap value by dispatching/senidng
   * message to global state.
   */
  const resetColumnGapInGlobalState = () => {
    dispatch(
      globalSetColumnGap({
        columnGap: undefined
      })
    )
  }

  /**
   * React useEffect callback method re-renders the component when
   * one of the values in the `Dependency Array`is updated or changed.
   */
  useEffect(() => {
    if (userHasResetGrid) {
      resetGrid()
      setTemplateBoxNumber(1)
    } else if (viewingCssCode) {
      sendParentCssCodeToGlobalState()
      sendChildrenCssCodeToGlobalState()
      setTemplateBoxNumber(1)
    } else {
      setParentElementGrid()
      setPositionsForChildElementsInGridLayout()
    }
  }, [numberOfRows, numberOfColumns, rowGap, columnGap, userHasResetGrid, viewingCssCode])

  return (
      <div className="gridDisplayerContainer" onMouseDown={(event) => setStartCoordinates(event)} onMouseUp={(event) => setEndCoordinates(event)}>
        {childElementCalculator.getClassNames().map((className) => {
          return (
          <div key={childElementCalculator.getClassNames().indexOf(className)} className={`gridBox ${className}`}></div>
          )
        })}
      </div>
  )
}

export default GridDisplayer
