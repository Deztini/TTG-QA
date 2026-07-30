import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import QuestionForm from "@/components/QuestionForm";

expect.extend(toHaveNoViolations);

describe("QuestionForm accessibility", () => {
  it("idle state should have no accessibility violations", async () => {
    const { container } = render(
      <QuestionForm onSubmitted={() => {}} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
