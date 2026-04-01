import express from 'express';
import { APIError } from '../middleware/errorHandler';

const router = express.Router();

router.post('/send-report', async (req, res, next) => {
  const { content, feishuWebhookUrl, type } = req.body;
  const webhookUrl = feishuWebhookUrl || process.env.FEISHU_WEBHOOK_URL;

  if (!webhookUrl) {
    return next(new APIError('飞书 Webhook 未配置。请在系统设置中填入 Webhook URL。', 400));
  }

  if (!content) {
    return next(new APIError('内容不能为空', 400));
  }

  const TRUNCATE_LIMIT = 28000;
  let finalContent = content;
  if (finalContent.length > TRUNCATE_LIMIT) {
    finalContent = finalContent.substring(0, TRUNCATE_LIMIT) + '\n\n... (由于长度确认，已截断剩余内容)';
  }

  try {
    let title = 'AI 交易研报';
    let template = 'blue';

    if (type === 'daily') {
      title = '📅 市场晨间内参';
      template = 'orange';
    } else if (type === 'discussion') {
      title = '🚀 联席专家研报总结';
      template = 'indigo';
    } else if (type === 'chat') {
      title = '🧠 深度追问解答';
      template = 'turquoise';
    } else if (type === 'stock') {
      title = '🔍 个股速览报告';
      template = 'green';
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: title },
            template: template,
          },
          elements: [
            {
              tag: 'div',
              text: { tag: 'lark_md', content: finalContent },
            },
            { tag: 'hr' },
            {
              tag: 'note',
              elements: [
                {
                  tag: 'plain_text',
                  content: `由 TradingAgents AI 专家组生成 • ${new Date().toLocaleString()}`,
                },
              ],
            },
          ],
        },
      }),
    });

    const data = (await response.json()) as any;
    if (data.code !== 0) throw new Error(data.msg || 'Feishu API 返回错误');

    res.json({ success: true });
  } catch (error: any) {
    next(new APIError(error.message || '无法发送报告至飞书，请检查 Webhook URL 是否正确。', 500));
  }
});

export default router;
