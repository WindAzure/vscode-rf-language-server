import * as _ from "lodash";
import * as chai from "chai";

import { decomposeKeywords } from "../composite-keywords-parser";
import { location } from "./test-helper";
import { DataCell } from "../table-models";

import {
    CallExpression,
    Identifier,
    Literal,
    VariableExpression
} from "../models";

describe("Composite keywords parser", () => {
    describe("decomposeKeywords", () => {
        it("treat Run Keywords as nothing and get final CallExpression", () => {
            const ignoreCell = new DataCell("Run Keywords", location(0, 4, 0, 16));
            const dataCell = new DataCell("Eat apple", location(0, 20, 0, 29));
            let callExpressionArray = decomposeKeywords([ignoreCell, dataCell]);

            const result = new CallExpression(
                new Identifier("Eat apple", location(0, 20, 0, 29)),
                [],
                location(0, 20, 0, 29)
            );

            chai.assert.equal(callExpressionArray.length, 1);
            chai.assert.deepEqual(callExpressionArray[0], result);
        });

        it("treat Run Keyword And Ignore Error as nothing and get final CallExpression", () => {
            const ignoreCell = new DataCell("Run Keyword And Ignore Error", location(0, 4, 0, 32));
            const dataCell = new DataCell("Eat apple", location(0, 36, 0, 40));
            let callExpressionArray = decomposeKeywords([ignoreCell, dataCell]);

            const result = new CallExpression(
                new Identifier("Eat apple", location(0, 36, 0, 40)),
                [],
                location(0, 36, 0, 40)
            );

            chai.assert.equal(callExpressionArray.length, 1);
            chai.assert.deepEqual(callExpressionArray[0], result);
        });

        it("treat AND as separator and get multiple CallExpressions", () => {
            const data1Cell = new DataCell("Say Hello", location(0, 35, 0, 44));
            const andCell = new DataCell("AND", location(0, 48, 0, 51));
            const data2Cell = new DataCell("Kiss Goodbye", location(0, 55, 0, 67));

            let callExpressionArray = decomposeKeywords([data1Cell, andCell, data2Cell]);

            const result = [
                new CallExpression(
                    new Identifier("Say Hello", location(0, 35, 0, 44)),
                    [],
                    location(0, 35, 0, 44)
                ),
                new CallExpression(
                    new Identifier("Kiss Goodbye", location(0, 55, 0, 67)),
                    [],
                    location(0, 55, 0, 67)
                )
            ];

            chai.assert.equal(callExpressionArray.length, 2);
            chai.assert.deepEqual(callExpressionArray, result);
        });

        it("treat datacell as CallExpression due to single space exist", () => {
            const data1Cell = new DataCell("Say Hello", location(0, 35, 0, 44));
            const data2Cell = new DataCell("Kiss Goodbye", location(0, 55, 0, 67));

            let callExpressionArray = decomposeKeywords([data1Cell, data2Cell]);

            const result = [
                new CallExpression(
                    new Identifier("Say Hello", location(0, 35, 0, 44)),
                    [],
                    location(0, 35, 0, 44)
                ),
                new CallExpression(
                    new Identifier("Kiss Goodbye", location(0, 55, 0, 67)),
                    [],
                    location(0, 55, 0, 67)
                )
            ];

            chai.assert.equal(callExpressionArray.length, 2);
            chai.assert.deepEqual(callExpressionArray, result);
        });

        it("treat datacell as argument of variable type due to single space not exist", () => {
            const data1Cell = new DataCell("Say Hello", location(0, 35, 0, 44));
            const data2Cell = new DataCell("${Lucy}", location(0, 48, 0, 55));

            let callExpressionArray = decomposeKeywords([data1Cell, data2Cell]);

            const result = [
                new CallExpression(
                    new Identifier("Say Hello", location(0, 35, 0, 44)),
                    [
                        new VariableExpression(
                            new Identifier("Lucy", location(0, 50, 0, 54)),
                            "Scalar",
                            location(0, 48, 0, 55)
                        )
                    ],
                    location(0, 35, 0, 55)
                )
            ];

            chai.assert.equal(callExpressionArray.length, 1);
            chai.assert.deepEqual(callExpressionArray, result);
        });

        it("compose correct callExpressions with multi-datacell", () => {
            const data1Cell = new DataCell("Say Hello", location(0, 35, 0, 44));
            const data2Cell = new DataCell("${Lucy}", location(0, 48, 0, 55));
            const data3Cell = new DataCell("Kiss Goodbye", location(0, 59, 0, 71));
            const data4Cell = new DataCell("Coco", location(0, 75, 0, 79));

            let callExpressionArray = decomposeKeywords([data1Cell, data2Cell, data3Cell, data4Cell]);

            const result = [
                new CallExpression(
                    new Identifier("Say Hello", location(0, 35, 0, 44)),
                    [
                        new VariableExpression(
                            new Identifier("Lucy", location(0, 50, 0, 54)),
                            "Scalar",
                            location(0, 48, 0, 55)
                        )
                    ],
                    location(0, 35, 0, 55)
                ),
                new CallExpression(
                    new Identifier("Kiss Goodbye", location(0, 59, 0, 71)),
                    [
                        new Literal("Coco", location(0, 75, 0, 79))
                    ],
                    location(0, 59, 0, 79)
                )
            ];

            chai.assert.equal(callExpressionArray.length, 2);
            chai.assert.deepEqual(callExpressionArray, result);
        });
    });
});
