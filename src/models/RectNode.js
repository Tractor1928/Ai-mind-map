// 定义节点类型常量
const NODE_TYPES = Object.freeze({
  QUESTION: 'question',
  ANSWER: 'answer'
});

// 创建一个矩形节点类
class RectNode {
  constructor(id, x, y, text = '', type = NODE_TYPES.QUESTION) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.text = text;
    this.type = type;
    this.parentId = null;    // 添加父节点ID
    this.childrenIds = [];   // 添加子节点ID数组
    this.level = 0;  // 添加层级属性
    this.width = 200;    // 添加默认宽度
    this.height = 100;   // 添加默认高度
    this.childrenTotalHeight = 0;  // 添加子节点总高度属性
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateText(text) {
    this.text = text;
  }

  updateType(type) {
    this.type = type;
  }
  
  // 添加设置父节点的方法
  setParent(parentId) {
    this.parentId = parentId;
  }

  // 添加子节点的方法
  addChild(childId) {
    if (!this.childrenIds.includes(childId)) {
      this.childrenIds.push(childId);
    }
  }

  // 添加设置层级的方法
  setLevel(level) {
    this.level = level;
  }

  // 添加设置尺寸的方法
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  // 计算所有子节点的总高度
  calculateChildrenTotalHeight(allNodes) {
    if (this.childrenIds.length === 0) {
      this.childrenTotalHeight = 0;
      return 0;
    }

    let minY = Infinity;
    let maxY = -Infinity;

    for (const childId of this.childrenIds) {
      const childNode = allNodes.find(node => node.id === childId);
      if (childNode) {
        if (childNode.y < minY) {
          minY = childNode.y;
        }
        if (childNode.y + childNode.height > maxY) {
          maxY = childNode.y + childNode.height;
        }
      }
    }

    const totalHeight = maxY - minY;
    this.childrenTotalHeight = totalHeight;
    return totalHeight;
  }
}

export { RectNode, NODE_TYPES }; 