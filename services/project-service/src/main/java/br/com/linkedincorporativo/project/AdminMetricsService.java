package br.com.linkedincorporativo.project;

import br.com.linkedincorporativo.project.domain.LlmUsageRecord;
import br.com.linkedincorporativo.project.repository.LlmUsageRecordRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AdminMetricsService {
    private static final BigDecimal ONE_MILLION = BigDecimal.valueOf(1_000_000);
    private final LlmUsageRecordRepository usageRecords;
    private final ZoneId zoneId;
    private final BigDecimal inputRate;
    private final BigDecimal outputRate;

    public AdminMetricsService(
        LlmUsageRecordRepository usageRecords,
        @Value("${admin.metrics-zone:America/Sao_Paulo}") String metricsZone,
        @Value("${llm.cost.input-per-million:0}") BigDecimal inputRate,
        @Value("${llm.cost.output-per-million:0}") BigDecimal outputRate
    ) {
        this.usageRecords = usageRecords;
        this.zoneId = ZoneId.of(metricsZone);
        this.inputRate = nonNegative(inputRate);
        this.outputRate = nonNegative(outputRate);
    }

    public Dashboard dashboard(int requestedDays) {
        int days = Math.max(1, Math.min(365, requestedDays));
        ZonedDateTime now = ZonedDateTime.now(zoneId);
        LocalDate today = now.toLocalDate();
        LocalDate periodStart = today.minusDays(days - 1L);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate queryStart = periodStart.isBefore(monthStart) ? periodStart : monthStart;
        Instant queryStartInstant = queryStart.atStartOfDay(zoneId).toInstant();
        List<LlmUsageRecord> records = usageRecords.findByCreatedAtGreaterThanEqualOrderByCreatedAtAsc(queryStartInstant);

        Stat period = new Stat();
        Stat month = new Stat();
        Map<LocalDate, Stat> daily = new TreeMap<>();
        Map<String, Stat> byContext = new TreeMap<>();
        Map<String, Stat> byProvider = new TreeMap<>();
        Map<String, Stat> byRequestType = new TreeMap<>();

        for (int index = 0; index < days; index++) daily.put(periodStart.plusDays(index), new Stat());
        for (LlmUsageRecord record : records) {
            LocalDate recordDate = record.getCreatedAt().atZone(zoneId).toLocalDate();
            if (!recordDate.isBefore(monthStart)) month.add(record);
            if (recordDate.isBefore(periodStart)) continue;
            period.add(record);
            daily.computeIfAbsent(recordDate, ignored -> new Stat()).add(record);
            byContext.computeIfAbsent(safe(record.getContextType(), "OUTRO"), ignored -> new Stat()).add(record);
            String providerKey = safe(record.getProvider(), "desconhecido") + " / " + safe(record.getModel(), "modelo não informado");
            byProvider.computeIfAbsent(providerKey, ignored -> new Stat()).add(record);
            byRequestType.computeIfAbsent(safe(record.getRequestType(), "OUTRO"), ignored -> new Stat()).add(record);
        }

        int elapsedDays = today.getDayOfMonth();
        int daysInMonth = today.lengthOfMonth();
        double factor = daysInMonth / (double) elapsedDays;
        Summary monthSummary = summary(month);
        Projection projection = new Projection(
            monthSummary,
            Math.round(month.requests * factor),
            Math.round(month.totalTokens * factor),
            money(cost(month).multiply(BigDecimal.valueOf(factor))),
            elapsedDays,
            daysInMonth,
            daysInMonth - elapsedDays
        );

        List<DailyMetric> dailyMetrics = daily.entrySet().stream()
            .map(entry -> new DailyMetric(entry.getKey(), summary(entry.getValue())))
            .toList();

        return new Dashboard(
            now.toInstant(),
            zoneId.getId(),
            days,
            periodStart,
            today,
            summary(period),
            projection,
            dailyMetrics,
            breakdown(byContext),
            breakdown(byProvider),
            breakdown(byRequestType),
            new Pricing(
                inputRate.signum() > 0 || outputRate.signum() > 0,
                "USD",
                inputRate,
                outputRate
            )
        );
    }

    private List<BreakdownMetric> breakdown(Map<String, Stat> stats) {
        List<BreakdownMetric> result = new ArrayList<>();
        stats.forEach((label, stat) -> result.add(new BreakdownMetric(label, summary(stat))));
        result.sort(Comparator.comparingLong((BreakdownMetric item) -> item.metrics().totalTokens()).reversed());
        return result;
    }

    private Summary summary(Stat stat) {
        double successRate = stat.requests == 0 ? 0 : stat.successfulRequests * 100.0 / stat.requests;
        double averageLatency = stat.requests == 0 ? 0 : stat.latencyMs / (double) stat.requests;
        double averageTokens = stat.requests == 0 ? 0 : stat.totalTokens / (double) stat.requests;
        return new Summary(
            stat.requests,
            stat.successfulRequests,
            stat.failedRequests,
            round(successRate, 2),
            stat.inputTokens,
            stat.outputTokens,
            stat.cachedContextTokens,
            stat.reasoningTokens,
            stat.totalTokens,
            round(averageTokens, 2),
            round(averageLatency, 2),
            stat.userIds.size(),
            money(cost(stat))
        );
    }

    private BigDecimal cost(Stat stat) {
        return BigDecimal.valueOf(stat.inputTokens).multiply(inputRate)
            .add(BigDecimal.valueOf(stat.outputTokens).multiply(outputRate))
            .divide(ONE_MILLION, 10, RoundingMode.HALF_UP);
    }

    private static BigDecimal nonNegative(BigDecimal value) {
        return value == null || value.signum() < 0 ? BigDecimal.ZERO : value;
    }

    private static BigDecimal money(BigDecimal value) { return value.setScale(6, RoundingMode.HALF_UP); }
    private static double round(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }
    private static String safe(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }

    private static class Stat {
        private long requests;
        private long successfulRequests;
        private long failedRequests;
        private long inputTokens;
        private long outputTokens;
        private long cachedContextTokens;
        private long reasoningTokens;
        private long totalTokens;
        private long latencyMs;
        private final Set<Long> userIds = new TreeSet<>();

        private void add(LlmUsageRecord record) {
            requests++;
            if (Boolean.TRUE.equals(record.getSuccessful())) successfulRequests++;
            else failedRequests++;
            inputTokens += value(record.getInputTokens());
            outputTokens += value(record.getOutputTokens());
            cachedContextTokens += value(record.getCachedContextTokens());
            reasoningTokens += value(record.getReasoningTokens());
            totalTokens += value(record.getTotalTokens());
            latencyMs += value(record.getLatencyMs());
            if (record.getUserId() != null) userIds.add(record.getUserId());
        }

        private static long value(Long value) { return value == null ? 0 : value; }
    }

    public record Dashboard(
        Instant generatedAt,
        String timeZone,
        int periodDays,
        LocalDate periodStart,
        LocalDate periodEnd,
        Summary totals,
        Projection currentMonth,
        List<DailyMetric> daily,
        List<BreakdownMetric> byContext,
        List<BreakdownMetric> byProvider,
        List<BreakdownMetric> byRequestType,
        Pricing pricing
    ) {}

    public record Summary(
        long requests,
        long successfulRequests,
        long failedRequests,
        double successRate,
        long inputTokens,
        long outputTokens,
        long cachedContextTokens,
        long reasoningTokens,
        long totalTokens,
        double averageTokensPerRequest,
        double averageLatencyMs,
        int uniqueUsers,
        BigDecimal estimatedCostUsd
    ) {}

    public record Projection(
        Summary actual,
        long projectedRequests,
        long projectedTotalTokens,
        BigDecimal projectedCostUsd,
        int elapsedDays,
        int daysInMonth,
        int remainingDays
    ) {}

    public record DailyMetric(LocalDate date, Summary metrics) {}
    public record BreakdownMetric(String label, Summary metrics) {}
    public record Pricing(boolean configured, String currency, BigDecimal inputPerMillion,
                          BigDecimal outputPerMillion) {}
}
