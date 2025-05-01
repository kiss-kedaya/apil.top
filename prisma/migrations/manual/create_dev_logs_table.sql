-- 创建开发日志表
CREATE TABLE IF NOT EXISTS dev_logs (
  id UUID PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  caller TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建用于分页和过滤的索引
CREATE INDEX IF NOT EXISTS idx_dev_logs_level ON dev_logs(level);
CREATE INDEX IF NOT EXISTS idx_dev_logs_created_at ON dev_logs(created_at DESC);

-- 创建清理日志的函数 (保留最近7天的日志)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM dev_logs WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql; 