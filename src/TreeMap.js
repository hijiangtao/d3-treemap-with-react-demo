import React, { useRef, useLayoutEffect, useState, useEffect, memo, FunctionComponent } from 'react';
import * as d3 from 'd3';

import {UID} from './UID';

const format = d3.format(",d");
const getColorSchema = (data = []) => {
  // 这里的 data 是处理过后的 children 内容
  return d3.scaleOrdinal(
    data.map(d => d.name), 
    d3.schemeCategory10.map(d => d3.interpolateRgb(d, "white")(0.5))
  );
};
const getMaxs = (data, index = -1) => {
  const sums = data.keys.map((d, i) => d3.hierarchy(data).sum(d => d.values ? Math.round(d.values[i]) : 0).value);
  return index === -1 ? d3.max(sums) : sums[index];
}
const validateDatasets = (data, index) => {
  return data.keys && data.children && data.keys.length >= index && index !== -1;
}

const getLayout = (mapdata, index, configs) => {
  const {width, height, tileType = 'treemapSlice', maxLayout, sortTransition} = configs;
  const tm = d3.treemap()
    .tile(d3[tileType])
    .size([width, height])
    .padding(d => d.height === 1 ? 1 : 0)
    .round(true);
  
  const root = tm(d3.hierarchy(mapdata)
    .sum(d => {
      return d.values ? d.values[index] : 0
    })
    .sort((a, b) => {
      return b.value - a.value
    }));

  return function() {
    const maxIndex = maxLayout ? -1 : index;
    const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / getMaxs(mapdata, maxIndex));
    const x = (1 - k) / 2 * width;
    const y = (1 - k) / 2 * height;

    const leaves = tm.size([width * k, height * k])(root)
      .each(d => (d.x0 += x, d.x1 += x, d.y0 += y, d.y1 += y))
      .leaves();

    // 不固定排序布局
    if (!mapdata.children[0].values || !sortTransition) return leaves;

    const newLeaves = new Array(leaves.length);
    const keyList = mapdata.children.map(({id}) => id);
    leaves.map(item => {
      const itemIndex = keyList.indexOf(item.data.id);
      newLeaves[itemIndex] = item;
    })

    return newLeaves;
  };
}

const chart = ({ 
  layout,
  color,
  ID 
}) => {
  // svg 画布
  if (document.getElementById(ID)) {
    return update(d3.select(`#${ID}`).selectAll("g"));
  }

  const leaf = d3.select(`#${ID}_svg`)
    .append("g")
    .attr('id', ID)
    .selectAll("g")
    .data(layout)
    .join("g")
    .attr("transform", d => {
      return `translate(${d.x0},${d.y0})`;
    });

  leaf.append("rect")
    .attr("id", d => (d.leafUid = UID('leaf')).id)
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0);

  leaf.append("clipPath")
    .attr("id", d => (d.clipUid = UID('clip')).id)
    .append("use")
    .attr("xlink:href", d => d.leafUid.href);

  leaf.append("text")
    .attr("clip-path", d => d.clipUid)
    .selectAll("tspan")
    .data(d => [d.data.name, format(d.value)])
    .join("tspan")
    .attr("x", 3)
    .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
    .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
    .text(d => d);

  leaf.append("title")
    .text(d => `${d.data.name} - PV ${d.value}`);

  function update(leaf) {
    leaf.data(layout)
      .transition()
      .duration(1000)
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .call(leaf => leaf.select("rect")
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0))
      .call(leaf => leaf.select("text tspan:first-child").text(d => d.data.name))
      .call(leaf => leaf.select("text tspan:last-child")
        .tween("text", function (d) {
          const i = d3.interpolateNumber(
            +this.textContent.replace(/,/g, ""), 
            d.value
          );
          
          return function (t) { 
            this.textContent = format(i(t)); 
          };
        }));
  }
}

interface TreeMapProps {
  index?: number,
  animation?: boolean,
  // Todo
  data?: {
    keys: [],
    children: []
  },
  configs: {
    width?: number,
    height?: number,
    tileType?: string,
    maxLayout?: boolean,
    sortTransition?: boolean,
  }
}

const TreeMap:FunctionComponent<TreeMapProps> = memo((props: TreeMapProps) => {
  const { index, data, animation, configs = {} } = props;
  const IDRef = useRef(UID('treemap').id);

  const frameRef = useRef();
  const [frameIndex, setFrameIndex] = useState(-1);
  frameRef.current = frameIndex;

  useEffect(() => {
    // null
    if (!validateDatasets(data, 0)) return ;
    
    let st, localIndex = index;
    if (animation) {
      st = setInterval(() => {
        if (frameRef.current === data.keys.length-1) {
          return clearInterval(st);
        } else {
          frameRef.current += 1;
          setFrameIndex(frameRef.current);
        }
      }, 1500);
      localIndex = 0;
    }
    
    setFrameIndex(localIndex);
    return () => clearInterval(st);
  }, [index, animation, data]);

  const {tileType, maxLayout, sortTransition} = configs;
  useLayoutEffect(() => {
    if (!validateDatasets(data, frameIndex)) return ;

    const layout = getLayout(data, frameIndex, configs);
    
    chart({
      layout,
      color: getColorSchema(data.children),
      ID: IDRef.current
    });
  }, [tileType, maxLayout, sortTransition, frameIndex]);

  return (
    <svg
      id={`${IDRef.current}_svg`}
      style={{
        width: '100%',
        height: 'auto',
        overflow: "visible",
        fontSize: `${parseInt(configs.width) ? Math.floor(configs.width / 400)*5 : 10}px`
      }}
      viewBox={`0 0 ${parseInt(configs.width) ? configs.width : 400} ${parseInt(configs.height) ? configs.height : 400}`}
    >
    </svg>
  )
});

export default TreeMap;