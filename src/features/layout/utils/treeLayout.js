import * as d3 from 'd3';

export const calculateTreeLayout = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return nodes;
  }

  // 创建层次结构数据
  const stratify = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parentId);

  // 将扁平数组转换为层次结构
  let root;
  try {
    root = stratify(nodes);
  } catch (e) {
    console.error('创建层次结构失败:', e);
    return nodes;
  }

  // 为每个节点添加尺寸信息
  root.each(node => {
    const originalNode = nodes.find(n => n.id.toString() === node.id);
    if (originalNode) {
      node.width = originalNode.width || 200;
      node.height = originalNode.height || 100;
      node.type = originalNode.type; // 保存节点类型
    } else {
      node.width = 200;
      node.height = 100;
    }
  });

  // 设置基础配置
  const minNodeDistance = 80; // 同级节点之间的最小垂直距离
  const minHorizontalGap = 100; // 最小水平间隙

  // 创建树形布局
  const treeLayout = d3.tree()
    .nodeSize([0, 0]) // 初始设置为0，后面会根据实际节点尺寸调整
    .separation((a, b) => {
      // 根据节点高度动态计算分离度
      const heightFactor = (a.height + b.height) / 2 / 100 + 1.5;
      return (a.parent === b.parent ? 1.5 : 2) * heightFactor;
    });

  // 计算初始布局
  treeLayout(root);

  // 第一次遍历：计算每个节点所需的水平空间
  calculateHorizontalSpace(root, nodes);

  // 第二次遍历：调整节点位置，考虑实际节点尺寸
  adjustHorizontalPositions(root, nodes, minHorizontalGap);

  // 调整垂直位置，避免节点重叠
  adjustVerticalPositions(root, minNodeDistance);

  // 向下传播垂直位置调整
  propagateVerticalAdjustments(root);

  // 将计算后的坐标转换回原始数据格式
  const updatedNodes = nodes.map(node => {
    const treeNode = root.find(d => d.id === node.id.toString());
    if (treeNode) {
      return {
        ...node,
        x: treeNode.y, // d3.tree 的 x 和 y 是相反的，所以这里交换
        y: treeNode.x
      };
    }
    return node;
  });

  return updatedNodes;
};

// 计算每个节点所需的水平空间
function calculateHorizontalSpace(node, allNodes) {
  if (!node) return 0;
  
  // 获取原始节点数据
  const originalNode = allNodes.find(n => n.id.toString() === node.id);
  const nodeWidth = originalNode ? originalNode.width : 200;
  
  // 如果没有子节点，返回当前节点宽度
  if (!node.children || node.children.length === 0) {
    node.requiredWidth = nodeWidth;
    return nodeWidth;
  }
  
  // 递归计算所有子节点所需的空间
  let childrenWidth = 0;
  node.children.forEach(child => {
    childrenWidth += calculateHorizontalSpace(child, allNodes);
  });
  
  // 节点所需的宽度是其自身宽度和子节点宽度的最大值
  node.requiredWidth = Math.max(nodeWidth, childrenWidth);
  return node.requiredWidth;
}

// 调整水平位置
function adjustHorizontalPositions(root, allNodes, minHorizontalGap) {
  // 按深度从小到大处理节点
  const maxDepth = Math.max(...Array.from(root.descendants(), node => node.depth));
  
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
    
    for (const node of nodesAtDepth) {
      // 获取原始节点数据
      const originalNode = allNodes.find(n => n.id.toString() === node.id);
      const nodeWidth = originalNode ? originalNode.width : 200;
      
      // 如果是根节点，设置初始位置
      if (depth === 0) {
        node.y = 0;
      }
      
      // 处理子节点的水平位置
      if (node.children && node.children.length > 0) {
        // 计算父节点右边缘位置
        const parentRightEdge = node.y + nodeWidth;
        
        // 为每个子节点设置水平位置
        node.children.forEach(child => {
          // 获取子节点的原始数据
          const childOriginal = allNodes.find(n => n.id.toString() === child.id);
          const childWidth = childOriginal ? childOriginal.width : 200;
          
          // 计算子节点与父节点之间的最小间距
          // 对于问答对，使用更大的间距
          let horizontalGap = minHorizontalGap;
          if (originalNode && childOriginal) {
            if ((originalNode.type === 'question' && childOriginal.type === 'answer') ||
                (originalNode.type === 'answer' && childOriginal.type === 'question')) {
              horizontalGap = Math.max(minHorizontalGap, nodeWidth / 2 + 150);
            } else {
              horizontalGap = Math.max(minHorizontalGap, nodeWidth / 2 + 100);
            }
          }
          
          // 设置子节点的水平位置
          child.y = parentRightEdge + horizontalGap;
        });
      }
    }
  }
}

// 调整垂直位置，避免节点重叠
function adjustVerticalPositions(root, minDistance) {
  // 按深度分组节点
  const nodesByDepth = {};
  root.each(node => {
    if (!nodesByDepth[node.depth]) {
      nodesByDepth[node.depth] = [];
    }
    nodesByDepth[node.depth].push(node);
  });

  // 对每个深度层级的节点进行垂直位置调整
  Object.keys(nodesByDepth).sort((a, b) => Number(a) - Number(b)).forEach(depth => {
    const nodes = nodesByDepth[depth];
    
    // 按垂直位置排序
    nodes.sort((a, b) => a.x - b.x);
    
    // 调整位置避免重叠
    for (let i = 1; i < nodes.length; i++) {
      const current = nodes[i];
      const previous = nodes[i - 1];
      
      // 计算所需的最小间距，考虑节点高度和额外的间距
      // 使用更大的基础间距，并根据节点高度动态调整
      const heightFactor = Math.max(1, (previous.height + current.height) / 200);
      const requiredGap = (previous.height / 2) + (current.height / 2) + (minDistance * heightFactor);
      
      // 如果间距不足，向下移动当前节点及其子树
      if (current.x - previous.x < requiredGap) {
        const offset = requiredGap - (current.x - previous.x);
        shiftSubtree(current, offset);
      }
    }
  });
}

// 向下传播垂直位置调整，确保父节点的变化影响子节点
function propagateVerticalAdjustments(root) {
  // 按深度从小到大处理，确保父节点的调整先于子节点
  const maxDepth = Math.max(...Array.from(root.descendants(), node => node.depth));
  
  for (let depth = 0; depth < maxDepth; depth++) {
    const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
    
    for (const node of nodesAtDepth) {
      if (node.children && node.children.length > 0) {
        // 计算子节点的垂直中心
        const childrenCenter = node.children.reduce((sum, child) => sum + child.x, 0) / node.children.length;
        
        // 如果父节点和子节点中心不对齐，调整子节点位置
        if (Math.abs(node.x - childrenCenter) > 1) {
          const offset = node.x - childrenCenter;
          
          // 移动所有子节点及其子树
          node.children.forEach(child => {
            shiftSubtree(child, offset);
          });
        }
        
        // 确保子节点之间没有重叠
        node.children.sort((a, b) => a.x - b.x);
        for (let i = 1; i < node.children.length; i++) {
          const current = node.children[i];
          const previous = node.children[i - 1];
          
          // 使用更大的基础间距，并根据节点高度动态调整
          const heightFactor = Math.max(1, (previous.height + current.height) / 200);
          const requiredGap = (previous.height / 2) + (current.height / 2) + (80 * heightFactor);
          
          if (current.x - previous.x < requiredGap) {
            const offset = requiredGap - (current.x - previous.x);
            shiftSubtree(current, offset);
          }
        }
      }
    }
  }
  
  // 第二次传播：自底向上确保所有子树之间没有重叠
  for (let depth = maxDepth - 1; depth >= 0; depth--) {
    const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
    
    for (const node of nodesAtDepth) {
      if (node.children && node.children.length > 0) {
        // 检查子树之间是否有重叠
        checkAndAdjustSubtreeOverlap(node.children);
      }
    }
  }
}

// 检查并调整子树之间的重叠
function checkAndAdjustSubtreeOverlap(siblings) {
  if (!siblings || siblings.length <= 1) return;
  
  // 按垂直位置排序
  siblings.sort((a, b) => a.x - b.x);
  
  // 获取每个节点的子树边界
  const subtreeBounds = siblings.map(node => {
    const descendants = node.descendants();
    if (descendants.length <= 1) {
      return {
        node: node,
        top: node.x - node.height / 2,
        bottom: node.x + node.height / 2
      };
    }
    
    // 计算子树的上下边界
    let minY = Infinity;
    let maxY = -Infinity;
    
    descendants.forEach(d => {
      const top = d.x - d.height / 2;
      const bottom = d.x + d.height / 2;
      
      if (top < minY) minY = top;
      if (bottom > maxY) maxY = bottom;
    });
    
    return {
      node: node,
      top: minY,
      bottom: maxY
    };
  });
  
  // 检查相邻子树之间的重叠并调整
  for (let i = 1; i < subtreeBounds.length; i++) {
    const current = subtreeBounds[i];
    const previous = subtreeBounds[i - 1];
    
    // 如果当前子树的顶部小于前一个子树的底部（有重叠）
    if (current.top < previous.bottom + 40) { // 添加40px的最小间距
      const offset = previous.bottom - current.top + 40;
      shiftSubtree(current.node, offset);
      
      // 更新当前子树的边界
      current.top += offset;
      current.bottom += offset;
    }
  }
}

// 移动节点及其所有子节点
function shiftSubtree(node, offset) {
  node.x += offset;
  if (node.children) {
    node.children.forEach(child => {
      shiftSubtree(child, offset);
    });
  }
} 