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
    this.minWidth = 200;     // 最小宽度
    this.maxWidth = 600;     // 最大宽度
    this.width = 200;        // 初始宽度设为最小宽度
    this.height = 100;   
    this.padding = 10;
    this.fontSize = 14;
    this.fontFamily = 'Arial';
    
    // 根据文本内容计算尺寸
    const dimensions = this.calculateDimensions(text);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.lines = dimensions.lines;
  }

  calculateDimensions(text) {
    if (!text) return { width: this.minWidth, height: 100, lines: [''] };
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    // 计算文本的实际宽度
    const textWidth = context.measureText(text).width;
    
    // 根据文本宽度确定节点宽度，保持在最小和最大宽度之间
    const nodeWidth = Math.min(Math.max(textWidth + (this.padding * 2), this.minWidth), this.maxWidth);
    
    const maxLineWidth = nodeWidth - (this.padding * 2);
    const lines = [];
    
    // 处理文本换行
    const paragraphs = text.split('\n');
    
    for (let paragraph of paragraphs) {
      if (!paragraph.trim()) {
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

    const lineHeight = this.fontSize * 1.3;
    const textHeight = Math.max(100, (lines.length * lineHeight) + (this.padding * 2));
    
    return {
      width: nodeWidth,
      height: textHeight,
      lines: lines
    };
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateText(text) {
    // 处理连续换行符
    const normalizedText = text.replace(/\n{2,}/g, '\n');
    this.text = normalizedText;
    const dimensions = this.calculateDimensions(normalizedText);
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
    this.width = Math.min(Math.max(width, this.minWidth), this.maxWidth);
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
    
    // 根据文本宽度确定节点宽度，保持在最小和最大宽度之间
    this.width = Math.min(Math.max(textWidth + (this.padding * 2), this.minWidth), this.maxWidth);
    this.height = Math.max(textHeight + (this.padding * 2), 100);
  }
}

export { RectNode, NODE_TYPES }; 