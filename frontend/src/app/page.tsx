"use client"
import Image from "next/image";
import React, { useEffect, useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { ArcherContainer, ArcherElement } from 'react-archer';

export default function Home() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeType, setSelectedNodeType] = useState("root");
  const [imageSrc, setImageSrc] = useState('')
  const canvasRef = useRef(null);
  const CANVAS_MARGIN_LEFT = 20;
  const CANVAS_MARGIN_TOP = 72;
  const [selectedNodes, setSelectedNodes] = useState([])
  const nodeOptions = [{
    label: "Root",
    value: "root"
  },
  {
    label: "Output",
    value: "output"
  },
  {
    label: "White Noise",
    value: "white_noise"
  }
  ];
  useEffect( () => {
    if (selectedNodes.length > 1) {

      connectNode(selectedNodes[0], selectedNodes[1]) 
    }
  }, [selectedNodes])
  useEffect( () => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800 
    canvas.height = 600 
  }, [])
  async function submitNodes () {
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nodes })
      });
      const data = await response.json();
      alert(data.message || data.error)
    } catch (error) {
      console.error('Error submitting nodes:', error);
    }
  };
  async function getImage() {
    try {
      const response = await fetch('http://localhost:3001/api/get_image')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setImageSrc(url)
    } catch(error) {

      console.log(error)
    }
  }
  const connectNode = (node, anotherNode) => {
      node.connectedIds = [...node.connectedIds, anotherNode.id] 
      drawNodeLines()
  }
  const drawNodeLines = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.beginPath();
    nodes.forEach((n1) => {
        nodes.forEach((n2) => {
            n1.connectedIds.forEach((id) => {

              if (id !== n2.id) {
                return
              }
              ctx.moveTo(n1.x, n1.y)
              ctx.lineTo(n2.x, n2.y)
            })
      })})
          ctx.strokeStyle = 'black';
          ctx.stroke();
  }
  const moveNode = (node, x,y) => {
    node.x = x;
    node.y = y;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const newNodes = [...nodes];
    setNodes(newNodes);
    drawNodeLines()
    }
  const addNode = () => {
    setNodes([...nodes, { id: Date.now(), connectedIds: [], type: selectedNodeType, x: 0, y: 0}]);
  };
  const onNodeTypeChange = (event) => {
    const newNode = event.target.value
    setSelectedNodeType(newNode)
  };
  useEffect(() => {
  }, [...nodes]);
  const nodeRef = React.createRef()
  return (
    <div style={{ padding: '20px' }}>
      <canvas ref={canvasRef} style={{position: 'absolute', top: `${CANVAS_MARGIN_TOP}px`, left: `${CANVAS_MARGIN_LEFT}px`, backgroundColor: 'lightgray'}}></canvas>
      <button style={{border: '1px solid white', padding: '8px'}}onClick={addNode}>Add Node</button>
      <select onChange={onNodeTypeChange} style={{width: '100px', height: '42px', marginLeft: '32px', padding: '8px', color: 'black'}} value={selectedNodeType} name="Node Type" id="node-type">
         {nodeOptions.map((option) => (
              <option value={option.value}>{option.label}</option>
          ))}
      </select>
      <button style={{border: '1px solid white', marginLeft: '20px', padding: '8px'}}onClick={async function () {await submitNodes(); await getImage()}}>Generate</button>
      {imageSrc && <img src={imageSrc} alt="Generated Bitmap Image" style={{position:'absolute', marginTop: '10px'}}/>}
      <div style={{ position: 'relative', width: '800px', height: '600px', border: '1px solid #ccc', marginTop: '10px' }}>
          <div>
        {nodes.map(rect => (
          <Draggable key={rect.id} position={{x: rect.x, y: rect.y}} onDrag={(e, data) => {moveNode(rect, data.x, data.y)}}>
            <div
              style={{
                width: '128px',
                height: '64px',
                backgroundColor: 'magenta',
                border: '1px solid white',
                position: 'absolute'
              }}>
              <p>{rect.type}</p>
              <button onClick={()=>{
                  if (selectedNodes.length >= 2) {
                    setSelectedNodes([rect])
                  }
                  else {
                    setSelectedNodes([...selectedNodes, rect])
                  }
                }}>Link</button>
            </div>
          </Draggable>
        ))}

        </div>
      </div>
    </div>
  );
}
