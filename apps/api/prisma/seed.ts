// Prisma seed — 把 v7.1 mock 数据写入真实 PG。
// 运行：pnpm prisma db seed（需要先有 DATABASE_URL 且 PG 已起）
import { PrismaClient } from "@prisma/client";
import { SEED_BENCHMARKS, SEED_MODELS, SEED_NEWS } from "../src/repository/seed-data";

const prisma = new PrismaClient();

async function main() {
  // 清掉旧数据（开发环境）
  await prisma.evaluation.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.benchmark.deleteMany();
  await prisma.model.deleteMany();

  for (const m of SEED_MODELS) {
    await prisma.model.create({
      data: {
        id: m.id,
        name: m.name,
        vendor: m.vendor,
        score: m.score,
        priceInput: m.priceInput,
        priceOutput: m.priceOutput,
        throughputTps: m.throughputTps,
        contextLength: m.contextLength,
        tier: m.tier,
        multimodal: m.multimodal,
        coding: m.coding,
        chinese: m.chinese,
        reasoning: m.reasoning,
        publishedAt: new Date(m.publishedAt),
      },
    });
  }

  for (const b of SEED_BENCHMARKS) {
    await prisma.benchmark.create({
      data: {
        name: b.name,
        weight: b.weight,
        sourceUrl: b.sourceUrl,
        contaminationRisk: b.contaminationRisk,
      },
    });
  }

  for (const n of SEED_NEWS) {
    await prisma.newsArticle.create({
      data: {
        title: n.title,
        summary: n.summary,
        sourceUrl: n.sourceUrl,
        category: n.category,
        relatedModelId: n.relatedModelId,
        publishedAt: new Date(n.publishedAt),
      },
    });
  }

  // 给每个模型写一条 price snapshot
  for (const m of SEED_MODELS) {
    await prisma.priceSnapshot.create({
      data: {
        modelId: m.id,
        priceInput: m.priceInput,
        priceOutput: m.priceOutput,
        capturedAt: new Date(),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed] done: ${SEED_MODELS.length} models, ${SEED_BENCHMARKS.length} benchmarks, ${SEED_NEWS.length} news`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
