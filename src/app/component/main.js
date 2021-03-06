// main viewer component
'use strict'

const {h} = require('deku')
const set = require('lodash.set')

const Nav = require('./nav')
const About = require('./about')
const GerberInput = require('./gerber-input')
const GerberOutput = require('./gerber-output')
const ViewSelect = require('./view-select')
const BoardSettings = require('./board-settings')
const View = require('./view')

const appAction = require('../action')
const {
  getSelectedView,
  getSelectedPanZoom,
  getLayerDisplayStates,
  getAboutIsOpen
} = require('../selector')

const layerAction = require('../../layer/action')
const {
  getLayers,
  getRenderedLayers,
  getRenders,
  getUnits,
  getTotalViewbox
} = require('../../layer/selector')

const boardAction = require('../../board/action')
const {getBoard} = require('../../board/selector')

const addGerber = (dispatch) => (event) => {
  const files = Array.from(event.target.files)

  files.forEach((file) => dispatch(layerAction.add(file)))
}

const switchView = (dispatch) => (view) => (event) => {
  event.preventDefault()
  event.stopPropagation()

  dispatch(appAction.switchView(view))
}

const toggleVisibility = (dispatch) => (id) => () => {
  dispatch(layerAction.toggleVisibility(id))
}

const setType = (dispatch) => (id) => (type) => {
  dispatch(layerAction.setType(id, type))
}

const setConversionOpts = (dispatch) => (id, conversionOpts, path) => (value) => {
  const opts = Object.assign({}, conversionOpts)

  dispatch(layerAction.setConversionOpts(id, set(opts, path, value)))
}

const setColor = (dispatch) => (id) => (event) => {
  dispatch(layerAction.setColor(id, event.target.value))
}

const removeGerber = (dispatch) => (id) => () => {
  dispatch(layerAction.remove(id))
}

const toggleLayerSettings = (dispatch) => (id) => () => {
  dispatch(appAction.toggleLayerSettings(id))
}

const handleFit = (dispatch) => (view) => () => {
  dispatch(appAction.fitView(view))
}

const handleZoom = (dispatch) => (view) => (event) => {
  event.stopPropagation()
  event.preventDefault()

  // clamp zoom at 10%
  const zoomDir = -Math.sign(event.deltaY)
  const zoomMag = Math.min(Math.abs(0.005 * event.deltaY), 0.25)

  const zoom = zoomDir * zoomMag
  const zoomX = event.clientX / event.currentTarget.clientWidth
  const zoomY = event.clientY / event.currentTarget.clientHeight

  dispatch(appAction.zoomView(view, zoom, zoomX, zoomY))
}

const handlePan = (dispatch) => (view) => (event) => {
  const panX = event.clientX / event.currentTarget.clientWidth
  const panY = event.clientY / event.currentTarget.clientHeight

  dispatch(appAction.panView(view, panX, panY))
}

const handleStartPan = (dispatch) => (view) => (event) => {
  const startX = event.clientX / event.currentTarget.clientWidth
  const startY = event.clientY / event.currentTarget.clientHeight

  dispatch(appAction.startPan(view, startX, startY))
}

const handleEndPan = (dispatch) => (view) => () => {
  dispatch(appAction.endPan(view))
}

const handleDiscretePan = (dispatch) => (view) => (direction) => {
  dispatch(appAction.discretePan(view, direction))
}

const handleZoomTo = (dispatch) => (view) => (zoom) => {
  dispatch(appAction.zoomTo(view, zoom))
}

const handleSetBoardColor = (dispatch) => (type) => (color) => {
  dispatch(boardAction.setColor(type, color))
}

const handleSetMaskWithOutline = (dispatch) => () => (mask) => {
  dispatch(boardAction.maskWithOutline(mask))
}

const openAbout = (dispatch) => (open) => {
  dispatch(appAction.openAbout(open))
}

module.exports = function renderMain({dispatch, context}) {
  const layers = getLayers(context)
  const board = getBoard(context)
  const renders = getRenders(context)
  const units = getUnits(context)
  const renderedLayers = getRenderedLayers(context)
  const layerDisplayStates = getLayerDisplayStates(context)
  const selectedView = getSelectedView(context)
  const selectedPanZoom = getSelectedPanZoom(context)
  const totalViewbox = getTotalViewbox(context)
  const aboutIsOpen = getAboutIsOpen(context)
  const dipatchOpenAbout = openAbout(dispatch)

  const windowAspect = context.browser.width / context.browser.height

  return h('div', {class: 'h-100 '}, [
    h(Nav, {openAbout: dipatchOpenAbout}),

    h(About, {isOpen: aboutIsOpen, open: dipatchOpenAbout}),

    h('div', {
      class: 'fixed right-0 w-25 app-max-ht mh3 app-mt3-past-nav z-1 flex flex-column'
    }, [
      h(ViewSelect, {view: selectedView, switchView: switchView(dispatch)}),
      h(GerberOutput, {
        layers,
        renders,
        units,
        layerDisplayStates,
        toggleVisibility: toggleVisibility(dispatch),
        remove: removeGerber(dispatch),
        setType: setType(dispatch),
        setConversionOpts: setConversionOpts(dispatch),
        setColor: setColor(dispatch),
        toggleSettings: toggleLayerSettings(dispatch)
      }),
      h(BoardSettings, {
        board,
        view: selectedView,
        handleSetColor: handleSetBoardColor(dispatch),
        handleSetMaskWithOutline: handleSetMaskWithOutline(dispatch)
      }),
      h(GerberInput, {addGerber: addGerber(dispatch)})
    ]),

    h('div', {class: 'relative w-100 h-100 overflow-hidden app-bg'}, [
      h(View, {
        view: selectedView,
        panZoom: selectedPanZoom,
        layers: renderedLayers,
        board,
        handleFit: handleFit(dispatch),
        handleZoom: handleZoom(dispatch),
        handlePan: handlePan(dispatch),
        handleStartPan: handleStartPan(dispatch),
        handleEndPan: handleEndPan(dispatch),
        handleDiscretePan: handleDiscretePan(dispatch),
        handleZoomTo: handleZoomTo(dispatch),
        totalViewbox,
        windowAspect
      })
    ])
  ])
}
