import * as d3 from 'd3';

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
  const {width = 400, height = 300, tileType = 'treemapSlice', maxLayout, sortTransition} = configs;
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
      // eslint-disable-next-line no-sequences
      .each(d => (d.x0 += x, d.x1 += x, d.y0 += y, d.y1 += y))
      .leaves();

    // 不固定排序布局
    if (!mapdata.children[0].values || !sortTransition) return leaves;

    const newLeaves = new Array(leaves.length);
    const keyList = mapdata.children.map(({id}) => id);
    // eslint-disable-next-line array-callback-return
    leaves.map(item => {
      const itemIndex = keyList.indexOf(item.data.id);
      newLeaves[itemIndex] = item;
    })

    return newLeaves;
  };
}

/**
 * 唯一 UID 生成器
 * @param {*} name 
 */
const UID = (name, fixed = false) => {
  let UID_CONST_COUNT = 0;
  return new Id("O-" + (name == null ? "" : name + "-") + (fixed ? 'const' : ++UID_CONST_COUNT));
}

function Id(id) {
  this.id = id;
  this.href = window.location.href + "#" + id;
}
Id.prototype.toString = function() {
  return "url(" + this.href + ")";
};

export {
  UID,
  format,
  getColorSchema,
  getMaxs,
  validateDatasets,
  getLayout,
}