let UID_CONST_COUNT = 0;

/**
 * 唯一 UID 生成器
 * @param {*} name 
 */
const UID = (name, fixed = false) => {
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
  UID
}