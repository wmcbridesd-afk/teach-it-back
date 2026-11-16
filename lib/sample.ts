import type { Material } from "@/lib/types";

export const SAMPLE_TOPIC = "Price elasticity of demand";

export const SAMPLE_MATERIALS: Material[] = [
  {
    id: "sample-notes",
    name: "Lecture 7 notes - Price elasticity of demand.md",
    tag: "Notes",
    text: `# Lecture 7: Price Elasticity of Demand

## Learning goals

By the end of today you should be able to:

- define price elasticity of demand and compute it with the midpoint method
- classify demand as elastic, inelastic, or unit elastic
- use the total revenue test to predict what happens to revenue when price changes
- explain why elasticity and slope are different things

## 1. Definition

Price elasticity of demand measures the **responsiveness of quantity demanded to a change in price**. The law of demand tells us that quantity demanded falls when price rises, but it does not tell us how much. Elasticity answers that question.

Ed = %ΔQd / %ΔP

**Sign convention.** Because of the law of demand, price and quantity move in opposite directions, so Ed is always negative. Economists almost always report the absolute value, |Ed|, and we will do the same from here on.

## 2. Midpoint (arc) method

The simple way to compute a percent change is to divide the change by the starting value. The problem is that the answer depends on which value you start from. Going from $10 to $12 is a 20% increase. Going from $12 back down to $10 is a 16.7% decrease. Same two points, different elasticity. That is not acceptable for a measure we want to use for comparison.

The midpoint method fixes this by using the average of the two values as the base:

%ΔQ = (Q2 − Q1) / ((Q1 + Q2) / 2)

%ΔP = (P2 − P1) / ((P1 + P2) / 2)

**Why it works.** The base is the same in both directions, so you get the same answer whether the price goes up or down between the same two points. Use the midpoint method on every problem unless told otherwise.

## 3. Categories

- **Elastic: |Ed| > 1.** Quantity responds more than proportionally to price. Example: restaurant meals eaten out.
- **Inelastic: |Ed| < 1.** Quantity responds less than proportionally to price. Example: gasoline in the short run.
- **Unit elastic: |Ed| = 1.** Quantity changes by exactly the same percentage as price.
- **Perfectly elastic.** A horizontal demand curve. Any price increase drops quantity to zero. A single wheat farmer facing the market price is the standard illustration.
- **Perfectly inelastic.** A vertical demand curve. Quantity does not change at all when price changes. This is the extreme case, not something you will see often.

## 4. Determinants of elasticity

- **Close substitutes.** The more substitutes available, the more elastic demand is. Demand for one specific brand of cereal is much more elastic than demand for cereal as a whole.
- **Necessity vs. luxury.** Necessities tend to be inelastic. Luxuries tend to be elastic. Ask yourself: would you cut back a lot if the price went up?
- **Share of budget.** Goods that take a large share of income tend to be more elastic, because a price change really hurts. Table salt is cheap and inelastic.
- **Time horizon.** Demand is more elastic in the long run, because people need time to adjust. Gasoline is the classic example. In the short run, a price spike barely changes how much people drive. Over several years, people buy fuel-efficient cars, move closer to work, or switch to transit.
- **Market definition.** Narrowly defined markets are more elastic than broad ones. "Food" is inelastic. "Brand X yogurt" is elastic.

## 5. Worked example

A coffee shop raises the price of a cup from $2 to $3, and daily sales fall from 110 cups to 90 cups.

%ΔQ = (90 − 110) / 100 = −20 / 100 = −20%

%ΔP = (3 − 2) / 2.50 = 1 / 2.50 = 40%

|Ed| = 20% / 40% = 0.5

Since 0.5 < 1, demand is **inelastic**. Total revenue rises: 2 × 110 = $220 before the change, and 3 × 90 = $270 after it.

## 6. The total revenue test

Total revenue is TR = P × Q. When price changes, two effects happen at once. The price effect changes revenue on each unit sold. The quantity effect changes the number of units sold. Elasticity tells you which effect wins.

- **Inelastic demand:** a price increase raises total revenue. The quantity effect is smaller than the price effect. (This is the coffee example.)
- **Elastic demand:** a price increase lowers total revenue. The quantity effect is larger than the price effect.
- **Unit elastic demand:** total revenue does not change when price changes.

Practical use: a firm facing inelastic demand can raise its price to earn more. A firm facing elastic demand should not.

## 7. Elasticity is not slope

This is the most common mistake on exams. Take a straight-line demand curve. Its slope is constant: every $1 increase in price reduces quantity by the same number of units. But elasticity is **not** constant along the curve, because elasticity is a percentage measure.

Formally, Ed = (ΔQ/ΔP) × (P/Q). The first term is the slope, and it is constant on a straight line. The second term, P/Q, changes as you move along the curve. So elasticity changes too.

Along a linear demand curve:

- at high prices and low quantities, demand is **elastic**
- at the midpoint of the curve, demand is **unit elastic**
- at low prices and high quantities, demand is **inelastic**

Example: P = 100 − 2Q. The slope is constant, but at P = 50 we have Q = 25 and P/Q = 2, so Ed = (−1/2)(2) = −1. That is unit elastic. Above that price demand is elastic, and below it demand is inelastic.

## Summary

- Ed = %ΔQ / %ΔP. Report the absolute value, |Ed|.
- Use the midpoint method so the answer does not depend on direction.
- |Ed| > 1 is elastic, |Ed| < 1 is inelastic, |Ed| = 1 is unit elastic.
- Determinants: substitutes, necessity vs. luxury, budget share, time, market definition.
- Total revenue test: inelastic means price up raises revenue; elastic means price up lowers it.
- Slope is not elasticity.
`,
  },
  {
    id: "sample-slides",
    name: "Lecture 7 slides.pdf",
    tag: "Slides",
    text: `Slide 1: Price Elasticity of Demand
ECON 101 | Lecture 7

Slide 2: Definition
- Price elasticity of demand = responsiveness of quantity demanded to a price change
- Law of demand: price up, quantity demanded down

Slide 3: Formula
- Ed = %change in Qd / %change in P
- Ed is negative by the law of demand
- Report the absolute value, |Ed|

Slide 4: Midpoint method
- %ΔQ = (Q2 − Q1) / ((Q1 + Q2) / 2)
- %ΔP = (P2 − P1) / ((P1 + P2) / 2)
- Same answer whether price rises or falls

Slide 5: Categories
- |Ed| > 1: elastic
- |Ed| < 1: inelastic
- |Ed| = 1: unit elastic
- Horizontal demand curve: perfectly elastic
- Vertical demand curve: perfectly inelastic

Slide 6: Determinants
- Close substitutes: more substitutes, more elastic
- Necessity (inelastic) vs. luxury (elastic)
- Larger share of budget: more elastic
- Time horizon: more elastic in the long run (gasoline)
- Narrow market definition: more elastic

Slide 7: Total revenue test
- TR = P × Q
- Inelastic: price up, TR up
- Elastic: price up, TR down
- Unit elastic: TR unchanged

Slide 8: Elasticity is not slope
- Straight-line demand: constant slope, but elasticity changes
- Elastic at high prices
- Unit elastic at the midpoint
- Inelastic at low prices

Slide 9: Real-world examples
- Insulin: very inelastic (necessity, no close substitutes)
- One specific cereal brand: very elastic (many close substitutes)

Slide 10: Summary
- Midpoint method for elasticity
- |Ed| tells you elastic, inelastic, or unit elastic
- Total revenue test follows from elasticity
- Slope is not elasticity
`,
  },
  {
    id: "sample-exam",
    name: "ECON 101 Midterm 1 (Fall 2025).pdf",
    tag: "Prior exam",
    text: `ECON 101 Midterm 1 (Fall 2025)
Total: 40 points. Answer all questions. Show your work.

Q1 (10 points) Multiple choice
Price elasticity of demand measures:
(a) the slope of the demand curve
(b) the responsiveness of quantity demanded to a change in price
(c) the responsiveness of quantity supplied to a change in price
(d) the change in total revenue resulting from a price change

Q2 (10 points) Midpoint calculation
The price of a monthly transit pass rises from $10 to $12, and the quantity of passes demanded falls from 200 to 160 per week. Using the midpoint method, compute the price elasticity of demand. Is demand elastic, inelastic, or unit elastic?

Q3 (10 points) Total revenue test
A city raises bus fares by 20%, and total fare revenue increases. What does this imply about the price elasticity of demand for bus rides? Explain using the total revenue test.

Q4 (10 points) Short answer
Demand for gasoline is more elastic in the long run than in the short run. Explain why.

---

ANSWER KEY

Q1: (b). Price elasticity of demand is the responsiveness of quantity demanded to a change in price.

Q2: %ΔQ = (160 − 200) / ((200 + 160) / 2) = −40 / 180 = −22.2%
%ΔP = (12 − 10) / ((10 + 12) / 2) = 2 / 11 = 18.2%
|Ed| = 22.2 / 18.2 ≈ 1.22
Since 1.22 > 1, demand is ELASTIC.

Q3: Total revenue rose after a price increase, so quantity fell by a smaller percentage than price rose. Demand is INELASTIC (|Ed| < 1).

Q4: In the short run, people are locked into existing vehicles and commutes, so they cannot respond much to a price change. In the long run, they have time to find substitutes: buy fuel-efficient cars, use public transit, carpool, or move closer to work.
`,
  },
  {
    id: "sample-assignment",
    name: "Problem Set 3 - graded.pdf",
    tag: "Graded assignment",
    text: `ECON 101 - Problem Set 3: Price Elasticity of Demand
Student: Alex Kim
Score: 15/20 (each problem is worth 4 points)

Problem 1: Which good is likely to be more price elastic, table salt or a luxury vacation cruise? Explain.
Student answer: The cruise. It's a luxury good, so people can easily cut back on it when the price goes up. Salt is a small share of the budget and a necessity.
Grader: ✓ 4/4

Problem 2: Concert tickets go from $40 to $50, and the quantity sold falls from 1,000 to 800. Compute the price elasticity of demand using the midpoint method, and classify demand.
Student answer: %ΔQ = (800 − 1000) / 1000 = −20%. %ΔP = (50 − 40) / 40 = 25%. |Ed| = 20 / 25 = 0.8. Inelastic.
Grader: ✗ −3: Use the midpoint method. %ΔQ = −200/900 = −22.2%, %ΔP = 10/45 = 22.2%, so |Ed| = 1.0 (unit elastic). Your method gives a different answer depending on the direction of the change.
Score: 1/4

Problem 3: A store cuts the price of a product by 10%, and its total revenue from that product rises. What does this tell you about demand?
Student answer: Demand is elastic. When price falls, quantity rises by more than the price falls, so revenue goes up.
Grader: ✓ 4/4

Problem 4: Is elasticity the same at every point on the linear demand curve P = 100 − 2Q? Explain.
Student answer: Yes. The demand curve is a straight line with constant slope (−2), so elasticity is the same everywhere.
Grader: ✗ −2: Slope ≠ elasticity. Elasticity depends on P/Q too: demand is elastic at high prices (upper half), unit elastic at the midpoint (P = 50), and inelastic at low prices.
Score: 2/4

Problem 5: Rank these from most to least price elastic over a one-year horizon, and explain: (a) insulin for a person with diabetes, (b) one specific brand of cereal.
Student answer: The cereal brand is more elastic than insulin. Insulin is a necessity with no close substitutes, so quantity barely responds to price. A specific cereal brand has many close substitutes, so people switch when its price rises.
Grader: ✓ 4/4

Total: 15/20
`,
  },
];
