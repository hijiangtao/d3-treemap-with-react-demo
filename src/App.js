import React, {useState} from 'react';
import './App.css';

import {Checkbox, Slider, Radio, Col, Row} from 'antd';
import TreeMap from './TreeMap.js';
import { MOCK_TREEMAP } from './mock';
import { tileTypes } from './constants';

const useInitData = () => {
  const [count, setCount] = useState(0);
  const [animation, setAnimation] = useState(false);
  const [maxLayout, setMaxLayout] = useState(false);
  const [tileType, setTileType] = useState(tileTypes[0]);
  const [sortTransition, setSortTransition] = useState(true);
  const [width, height] = [600, 400];

  return [
    width,
    height,
    count, 
    setCount,
    animation,
    setAnimation,
    maxLayout,
    setMaxLayout,
    tileType,
    setTileType,
    sortTransition,
    setSortTransition
  ]
}

function App() {
  const [
    width,
    height,
    count, 
    setCount,
    animation,
    setAnimation,
    maxLayout,
    setMaxLayout,
    tileType,
    setTileType,
    sortTransition,
    setSortTransition
  ] = useInitData();

  return (
    <div className="App">
      <h1>TreeMap <a href="https://github.com/hijiangtao/d3-treemap-with-react-demo">GitHub</a></h1>
      <Row>
          <Col span={5}>
            <Checkbox checked={animation} onChange={(e) => setAnimation(e.target.checked)}>逐帧动画</Checkbox>
          </Col>
          <Col span={5}>
            <Checkbox checked={maxLayout} onChange={(e) => setMaxLayout(e.target.checked)}>最大化计算</Checkbox>
          </Col>
          <Col span={5}>
            <Checkbox checked={sortTransition} onChange={(e) => setSortTransition(e.target.checked)}>动画是否溯源</Checkbox>
          </Col>
          <Col span={5}>
            <Slider 
              style={{
                marginTop: '6px',
              }}
              defaultValue={count}
              min={0}
              max={20}
              onAfterChange={(e) => {
                setAnimation(false);
                setCount(e);
              }}
            />
          </Col>
          <span>布局类型</span>
          <Col span={21}>
            <Radio.Group size="small" value={tileType} onChange={(e) => {setTileType(e.target.value)}}>
              {tileTypes.map(item => (<Radio.Button value={item} key={item}>{item.slice(7)}</Radio.Button>))}
            </Radio.Group>
          </Col>
      </Row>

      <TreeMap 
        configs={{
          width,
          height,
          tileType,
          maxLayout,
          sortTransition,
        }}
        index={count}
        animation={animation}
        data={MOCK_TREEMAP} />
    </div>
  );
}

export default App;
