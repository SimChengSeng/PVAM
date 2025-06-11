import { differenceInMonths } from "date-fns";

/**
 * Calculate total vehicle condition score and per-part condition breakdown
 * @param {Object} vehicle - Vehicle object with mileage, drivingStyle, partCondition[]
 * @returns {{
 *   totalScore: number,
 *   partScores: Array<{
 *     partId: string,
 *     name: string,
 *     score: number,
 *     mileageScore: number,
 *     timeScore: number,
 *     penalty: number
 *   }>
 * }}
 */
export function calculateVehicleConditionExtended(vehicle) {
  const mileage = parseInt(vehicle.mileage || "0");
  const drivingStyle = vehicle.drivingStyle || "normal";
  const parts = vehicle.partCondition || [];

  const partScores = [];
  let total = 0;

  parts.forEach((part) => {
    const {
      partId,
      name,
      lastServiceMileage,
      lastServiceDate,
      defaultLifespanKm,
      defaultLifespanMonth,
      inspectionStatus,
    } = part;

    // Skip part if any of the required fields are missing or invalid
    if (
      !lastServiceMileage ||
      !lastServiceDate ||
      !defaultLifespanKm ||
      !defaultLifespanMonth
    ) {
      console.warn(`Skipped part "${name}" due to incomplete data`);
      return;
    }

    const parsedLastMileage = parseInt(lastServiceMileage);
    const mileageSince = mileage - parsedLastMileage;
    const mileageRatio = mileageSince / defaultLifespanKm;
    const mileageScore = 1 - Math.min(mileageRatio, 1);

    const parsedLastDate = new Date(lastServiceDate);
    const monthsSince = differenceInMonths(new Date(), parsedLastDate);
    const timeRatio = monthsSince / defaultLifespanMonth;
    const timeScore = 1 - Math.min(timeRatio, 1);

    const penaltyMap = {
      ok: 0,
      warning: 0.1,
      critical: 0.3,
    };
    const penalty = penaltyMap[inspectionStatus] || 0;

    const weightedScore = mileageScore * 0.6 + timeScore * 0.4 - penalty;
    const clampedScore = Math.max(0, Math.min(1, weightedScore));
    const finalPartScore = Math.round(clampedScore * 100);

    partScores.push({
      partId: partId || name?.toLowerCase().replace(/\s+/g, "_"),
      name: name || partId || "Unnamed Part",
      score: finalPartScore,
      mileageScore: parseFloat(mileageScore.toFixed(2)),
      timeScore: parseFloat(timeScore.toFixed(2)),
      penalty: penalty,
    });

    total += clampedScore;
  });

  // Average the score across all parts
  let averageScore = partScores.length > 0 ? total / partScores.length : 0;

  // Apply driving style multiplier
  const styleMultiplier = {
    calm: 1.0,
    normal: 0.95,
    aggressive: 0.85,
  };
  const multiplier = styleMultiplier[drivingStyle] || 1.0;

  const totalScore = Math.round(
    Math.max(0, Math.min(100, averageScore * 100 * multiplier))
  );

  return {
    totalScore,
    partScores,
  };
}
