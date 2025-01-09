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

  // 创建树形布局
  const treeLayout = d3.tree()
    .nodeSize([120, 700]); // 水平间距增加到700以适应600px宽度的节点

  // 计算布局
  treeLayout(root);

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