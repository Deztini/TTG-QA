import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import QuestionList from "@/components/QuestionList";
import { Question } from "@/types/question";

expect.extend(toHaveNoViolations);

const sampleQuestion: Question = {
  id: "1",
  text: "What is a closure?",
  author: "Alice",
  timestamp: "2024-06-01T12:00:00.000Z",
};

describe("QuestionList accessibility", () => {
  it("loading state (no prior data) should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionList
        questions={[]}
        loading={true}
        error={null}
        hasPriorData={false}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("empty state should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionList
        questions={[]}
        loading={false}
        error={null}
        hasPriorData={false}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("error without prior data (full-page error) should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionList
        questions={[]}
        loading={false}
        error="Some error"
        hasPriorData={false}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("error with prior data (non-blocking banner) should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionList
        questions={[sampleQuestion]}
        loading={false}
        error="Some error"
        hasPriorData={true}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("non-empty list should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionList
        questions={[sampleQuestion]}
        loading={false}
        error={null}
        hasPriorData={true}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
