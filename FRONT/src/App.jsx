import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Client } from '@stomp/stompjs';
import { ActionTypes } from './utilities/constants';
import axios from 'axios'
import './index.css'

function App () {
  const canvasRef = useRef()
  const contextRef = useRef()
  const colorsRef = useRef(null)
  const url = 'http://localhost:8080/api/send-offset'
  // const [isDrawing, setIsDrawing] = useState(false)
  const isDrawing = useRef(false)
  // const cliente = useRef(null)
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current
    const test = colorsRef.current

    const colors = document.getElementsByClassName('color')
    const current = {
      color: 'black'
    }

    const onColorUpdate = (e) => {
      current.color = e.target.className.split(' ')[1]
      context.strokeStyle = e.target.className.split(' ')[1]
    }

    // loop through the color elements and add the click event listeners
    for (let i = 0; i < colors.length; i++) {
      colors[i].addEventListener('click', onColorUpdate, false)
    }

    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`

    const context = canvas.getContext('2d')
    context.scale(2, 2)
    context.lineCap = 'round'
    context.strokeStyle = current.color
    context.lineWidth = 5
    contextRef.current = context

    const cliente = new Client({
      brokerURL: 'ws://localhost:8080/websocket'
    })
    cliente.onConnect = () => {
      console.log('Conectado')
      cliente.subscribe('/whiteboard/offset', (m) => {
        const coordenada = JSON.parse(m.body)
        console.log('coordenada', coordenada)
        remoteDrawController(coordenada)
      })
    }
    cliente.activate()
    setStompClient(cliente)
    return () => {
      if (cliente) {
        cliente.deactivate()
      }
    }
  }, [])

  const draw = useCallback((offsetX, offsetY, isRemote) => {
    console.log('draw1', offsetX, offsetY, isDrawing.current)
    if (!isDrawing.current) {
      return
    }
    if (!isRemote) {
      const data = { actionType: ActionTypes.DRAW, offset: { x: offsetX, y: offsetY }, color: contextRef.current.strokeStyle }
      stompClient.publish({ destination: '/whiteboard/offset', body: JSON.stringify(data) })
    }

    contextRef.current.lineTo(offsetX, offsetY)
    contextRef.current.stroke()
  }, [stompClient])

  const onInitDrawing = (offsetX, offsetY, isRemote) => {
    isDrawing.current = true
    // axios.post(url, { actionType: ActionTypes.START, offset: { x: offsetX, y: offsetY } })
    if (!isRemote) {
      const data = { actionType: ActionTypes.START, offset: { x: offsetX, y: offsetY }, color: contextRef.current.strokeStyle }
      stompClient.publish({ destination: '/whiteboard/offset', body: JSON.stringify(data) })
    }
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
    // setIsDrawing(true)
  }

  const onEndDrawing = (isRemote) => {
    isDrawing.current = false
    // axios.post(url, { actionType: ActionTypes.END, offset: { x: 0, y: 0 } })
    if (!isRemote) {
      const data = { actionType: ActionTypes.END, offset: { x: 0, y: 0 } }
      stompClient.publish({ destination: '/whiteboard/offset', body: JSON.stringify(data) })
    }
    contextRef.current.closePath()
    // setIsDrawing(false)
  }

  const remoteDrawController = useCallback((data) => {
    if (data.color && data.color !== contextRef.current.strokeStyle) {
      contextRef.current.strokeStyle = data.color
    }
    const type = ActionTypes[data.actionType]
    console.log(ActionTypes[data.actionType], data.actionType)
    switch (type) {
      case ActionTypes.START:
        onInitDrawing(data.offset.x, data.offset.y, true)
        break
      case ActionTypes.DRAW:
        draw(data.offset.x, data.offset.y, true)
        break
      case ActionTypes.END:
        onEndDrawing(true)
        break
      case ActionTypes.CLEAR:
        handleClear(true)
        break
      default:
        break
    }
  }, [draw])

  const handleOnDraw = ({ nativeEvent }) => {
    if (!isDrawing.current) {
      return
    }
    const { offsetX, offsetY } = nativeEvent
    draw(offsetX, offsetY)
  }

  const onMouseDown = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent
    onInitDrawing(offsetX, offsetY, false)
  }

  const onMouseUp = () => {
    onEndDrawing(false)
  }

  const handleClear = async (isRemote) => {
    if (!isRemote) {
      const data = { actionType: ActionTypes.CLEAR, offset: { x: 0, y: 0 } }
      await stompClient.publish({ destination: '/whiteboard/offset', body: JSON.stringify(data) })
    }
    contextRef.current.clearRect(0, 0, window.innerWidth, window.innerHeight)
  }

  return (
    <div>
      <div ref={colorsRef} className='colors'>
        <div className='color black' />
        <div className='color red' />
        <div className='color green' />
        <div className='color blue' />
        <div className='color yellow' />
        <button onClick={() => handleClear(false)}>Limpiar</button>
      </div>
      <canvas
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={handleOnDraw}
        ref={canvasRef}
      />
    </div>
  )
}

export default App
