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
    this.maxWidth = 600;    // 从200改为600
    this.width = 600;       // 从200改为600
    this.height = 100;   
    this.padding = 10;
    this.fontSize = 14;
    this.fontFamily = 'Arial';
    
    // 移除固定高度，改为通过计算得到
    const dimensions = this.calculateDimensions(text);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.lines = dimensions.lines;
  }

  calculateDimensions(text) {
    if (!text) return { width: 600, height: 100, lines: [''] };
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    const maxLineWidth = this.maxWidth - (this.padding * 2);
    const lines = [];
    
    // 首先按自然换行符分割
    const paragraphs = text.split('\n');
    
    for (let paragraph of paragraphs) {
      if (!paragraph) {
        lines.push('');
        continue;
      }
      
      const hasEnglish = /[a-zA-Z]/.test(paragraph);
      
      if (hasEnglish) {
        const words = paragraph.split(/(\s+)/);
        let currentLine = '';
        
        for (let word of words) {
          const testLine = currentLine + word;
          const width = context.measureText(testLine).width;
          
          if (width < maxLineWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine.trim());
      } else {
        let currentLine = '';
        for (let char of paragraph) {
          const testLine = currentLine + char;
          const width = context.measureText(testLine).width;
          
          if (width < maxLineWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = char;
          }
        }
        if (currentLine) lines.push(currentLine);
      }
    }

    // 增加行高
    const lineHeight = this.fontSize * 1.3; 
    const textHeight = Math.max(100, (lines.length * lineHeight) + (this.padding * 2));
    
    return {
      width: this.maxWidth,
      height: textHeight,
      lines: lines
    };
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateText(text) {
    this.text = text;
    const dimensions = this.calculateDimensions(text);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.lines = dimensions.lines;
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
    
    // 修改最小宽度为600px
    this.width = Math.max(textWidth + (this.padding * 2), 600);
    this.height = Math.max(textHeight + (this.padding * 2), 100);
  }
}

export { RectNode, NODE_TYPES }; 