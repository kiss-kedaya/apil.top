// 获取传入的参数
const name = params.name || "世界";
const count = params.count || 1;

// 示例业务逻辑
function generateGreeting(name, count) {
  const greetings = [];
  for (let i = 0; i < count; i++) {
    greetings.push(`你好，${name}! (${i + 1})`);
  }
  return greetings;
}

// 记录日志
console.log("开始生成问候语");
console.log(`参数: name=${name}, count=${count}`);

// 执行业务逻辑
const greetings = generateGreeting(name, count);

// 记录日志
console.log("问候语生成完成");
console.log(`共生成 ${greetings.length} 条问候语`);

// 设置结果（这将被返回给API调用者）
result = {
  greetings: greetings,
  timestamp: new Date().toISOString(),
  executionInfo: {
    parameterUsed: { name, count },
    generatedCount: greetings.length
  }
}; 