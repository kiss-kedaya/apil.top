const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 查找所有API文件
const apiFiles = glob.sync('app/api/**/*.ts', { cwd: process.cwd() });

console.log(`找到 ${apiFiles.length} 个API文件需要检查`);

let updatedFiles = 0;

// 第一遍处理：替换console.error为logger.error
apiFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 检查文件是否包含console.error
  if (content.includes('console.error')) {
    // 替换console.error为logger.error
    const updatedContent = content.replace(
      /console\.error\((['"`])(.*?)\1,\s*(.*?)\);/g, 
      'logger.error($1$2$1, $3);'
    ).replace(
      /console\.error\((['"`])(.*?)\1\);/g, 
      'logger.error($1$2$1);'
    ).replace(
      /console\.error\((.*?)\);/g, 
      (match, args) => {
        // 处理特殊情况，如多行错误消息等
        if (args.includes('\n')) {
          return match;
        }
        if (!args.startsWith('"') && !args.startsWith("'") && !args.startsWith('`')) {
          return `logger.error("API错误", ${args});`;
        }
        return `logger.error(${args});`;
      }
    );
    
    // 如果内容有变化，写入文件
    if (content !== updatedContent) {
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      updatedFiles++;
      console.log(`已更新: ${filePath}`);
    }
  }
});

console.log(`完成第一阶段! 共更新了 ${updatedFiles} 个文件。`);

// 第二遍处理：确保所有使用logger的文件都正确引入了logger模块
let importFixedFiles = 0;

apiFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 检查文件是否引入了logger和使用了logger
  const hasLoggerImport = content.includes('import { logger }') || content.includes('import {logger}');
  const usesLogger = content.includes('logger.error');
  
  // 如果使用了logger但没有导入，添加导入
  if (usesLogger && !hasLoggerImport) {
    // 查找合适的位置添加导入
    let lines = content.split('\n');
    let lastImportLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import ') && lines[i].includes(' from ')) {
        lastImportLine = i;
      }
    }
    
    if (lastImportLine >= 0) {
      lines.splice(lastImportLine + 1, 0, 'import { logger } from "@/lib/logger";');
      const updatedContent = lines.join('\n');
      fs.writeFileSync(fullPath, updatedContent, 'utf8');
      importFixedFiles++;
      console.log(`修复导入: ${filePath}`);
    } else {
      console.log(`警告: 无法找到合适的位置添加导入: ${filePath}`);
    }
  }
});

console.log(`完成第二阶段! 修复了 ${importFixedFiles} 个文件的导入。`);
console.log(`总计: 更新了 ${updatedFiles} 个文件，修复了 ${importFixedFiles} 个文件的导入。`); 