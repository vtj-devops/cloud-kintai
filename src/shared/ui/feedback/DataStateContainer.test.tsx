import { render, screen } from "@testing-library/react";

import { DataStateContainer } from "./DataStateContainer";

jest.mock("./PageLoader", () => {
  function MockPageLoader() {
    return <div data-testid="page-loader" />;
  }
  return MockPageLoader;
});

describe("DataStateContainer", () => {
  it("shows loadingContent when isLoading is true", () => {
    render(
      <DataStateContainer
        isLoading
        hasData={false}
        loadingContent={<div data-testid="loading" />}
        emptyContent={<div data-testid="empty" />}
      >
        <div data-testid="data" />
      </DataStateContainer>,
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("data")).not.toBeInTheDocument();
  });

  it("shows default PageLoader when isLoading is true and loadingContent is omitted", () => {
    render(
      <DataStateContainer isLoading hasData={false}>
        <div data-testid="data" />
      </DataStateContainer>,
    );
    expect(screen.getByTestId("page-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("data")).not.toBeInTheDocument();
  });

  it("shows emptyContent when not loading and hasData is false", () => {
    render(
      <DataStateContainer
        isLoading={false}
        hasData={false}
        loadingContent={<div data-testid="loading" />}
        emptyContent={<div data-testid="empty" />}
      >
        <div data-testid="data" />
      </DataStateContainer>,
    );
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("data")).not.toBeInTheDocument();
  });

  it("renders nothing for emptyContent when omitted and hasData is false", () => {
    const { container } = render(
      <DataStateContainer isLoading={false} hasData={false}>
        <div data-testid="data" />
      </DataStateContainer>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows children when not loading and hasData is true", () => {
    render(
      <DataStateContainer
        isLoading={false}
        hasData
        loadingContent={<div data-testid="loading" />}
        emptyContent={<div data-testid="empty" />}
      >
        <div data-testid="data" />
      </DataStateContainer>,
    );
    expect(screen.getByTestId("data")).toBeInTheDocument();
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("empty")).not.toBeInTheDocument();
  });
});
