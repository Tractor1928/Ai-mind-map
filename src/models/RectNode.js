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
    this.maxWidth = 200;    // 添加最大宽度限制
    this.width = 200;    
    this.height = 100;   
    this.padding = 10;
    this.fontSize = 14;
    this.fontFamily = 'Arial';
    this.lines = this.calculateLines(text); // 初始化时就计算换行
  }

  calculateLines(text) {
    if (!text) return [''];
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    const maxLineWidth = this.maxWidth - (this.padding * 2);
    const lines = [];
    let currentLine = '';
    
    // 将文本按字符分割，而不是按空格分割
    const chars = text.split('');
    
    for (let char of chars) {
      const testLine = currentLine + char;
      const width = context.measureText(testLine).width;
      
      if (width < maxLineWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = char;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // 更新节点高度以适应文本行数
    const lineHeight = this.fontSize * 1.2;
    this.height = Math.max(100, (lines.length * lineHeight) + (this.padding * 2));
    
    return lines;
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateText(text) {
    this.text = text;
    this.lines = this.calculateLines(text);
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

  calculateTextDimensions() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.2;
    const widths = lines.map(line => context.measureText(line).width);
    
    const textWidth = Math.max(...widths);
    const textHeight = lineHeight * lines.length;
    
    // 添加内边距
    this.width = Math.max(textWidth + (this.padding * 2), 200); // 最小宽度 200px
    this.height = Math.max(textHeight + (this.padding * 2), 100); // 最小高度 100px
  }
}

export { RectNode, NODE_TYPES }; 