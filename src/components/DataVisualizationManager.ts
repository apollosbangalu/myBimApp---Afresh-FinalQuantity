// src/components/DataVisualizationManager.ts

import * as OBC from "@thatopen/components";
import {
  Chart,
  ChartType,
  ChartData,
  ChartOptions,
  ChartConfiguration,
} from "chart.js/auto";
import { TooltipItem } from "chart.js";

type GenericChart = Chart<ChartType, any[], unknown>;

interface ClassificationItem {
  id: number | null;
  name: string;
  map: { [fragmentId: string]: Set<number> };
}

export class DataVisualizationManager {
  private components: OBC.Components;
  private charts: Map<string, GenericChart> = new Map();
  private static instance: DataVisualizationManager;

  private constructor(components: OBC.Components) {
    this.components = components;
  }

  public static getInstance(
    components: OBC.Components
  ): DataVisualizationManager {
    if (!DataVisualizationManager.instance) {
      DataVisualizationManager.instance = new DataVisualizationManager(
        components
      );
    }
    return DataVisualizationManager.instance;
  }

  public createElementTypeChart(
    containerId: string,
    chartType: ChartType = "doughnut"
  ): void {
    const fragmentManager = this.components.get(OBC.FragmentsManager);
    const classifier = this.components.get(OBC.Classifier);

    // Check if models are loaded
    if (fragmentManager.groups.size === 0) {
      console.warn(
        "No models loaded. Please load a model before creating the chart."
      );
      return;
    }

    // Destroy existing chart if it exists
    this.destroyChart(containerId);

    // Object to store element type counts
    const elementTypes: { [key: string]: number } = {};

    // Check if 'entities' classification exists
    if (
      !classifier.list.entities ||
      typeof classifier.list.entities !== "object"
    ) {
      console.warn(
        "No 'entities' classification found or it's not in the expected format."
      );
      return;
    }

    // Count element types
    for (const [entityType, classificationItem] of Object.entries(
      classifier.list.entities
    )) {
      const item = classificationItem as ClassificationItem;
      let count = 0;
      for (const fragmentSet of Object.values(item.map)) {
        count += fragmentSet.size;
      }
      elementTypes[entityType] = count;
    }

    // Check if we have any data to display
    if (Object.keys(elementTypes).length === 0) {
      console.warn(
        "No classification data available. The model might not be properly classified."
      );
      return;
    }

    // Prepare data for the chart
    const data: ChartData<ChartType, number[], string> = {
      labels: Object.keys(elementTypes),
      datasets: [
        {
          data: Object.values(elementTypes),
          backgroundColor: this.generateColors(
            Object.keys(elementTypes).length
          ),
        },
      ],
    };

    // Create the chart options
    const options: ChartOptions<ChartType> = {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Element Types Distribution",
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<ChartType>) => {
              const label = context.label || "";
              const value = context.parsed as number;
              const dataset = context.dataset.data as number[];
              const total = dataset.reduce((acc, curr) => acc + curr, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    };

    // Create the chart configuration
    const config: ChartConfiguration<ChartType, number[], string> = {
      type: chartType,
      data: data,
      options: options,
    };

    // Create the chart
    const ctx = document.getElementById(containerId) as HTMLCanvasElement;
    const chart = new Chart(ctx, config);

    // Store the chart instance
    this.charts.set(containerId, chart as GenericChart);
  }

  // Generate an array of colors for the chart
  private generateColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${(i * 360) / count}, 70%, 50%)`);
    }
    return colors;
  }

  // Update all charts
  public updateCharts(): void {
    this.charts.forEach((chart) => chart.update());
  }

  // Destroy a specific chart
  private destroyChart(containerId: string): void {
    const existingChart = this.charts.get(containerId);
    if (existingChart) {
      existingChart.destroy();
      this.charts.delete(containerId);
    }
  }

  // Export chart as image
  public exportChartAsImage(
    containerId: string,
    fileName: string = "chart"
  ): void {
    const chart = this.charts.get(containerId);
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.png`;
      link.click();
    }
  }

  // Generate simple report
  public generateReport(containerId: string): string {
    const chart = this.charts.get(containerId);
    if (!chart) return "No chart data available.";

    const data = chart.data.datasets[0].data as number[];
    const labels = chart.data.labels as string[];
    const total = data.reduce((acc, curr) => acc + curr, 0);

    let report = "Element Type Distribution Report:\n\n";

    for (let i = 0; i < data.length; i++) {
      const percentage = ((data[i] / total) * 100).toFixed(2);
      report += `${labels[i]}: ${data[i]} (${percentage}%)\n`;
    }

    return report;
  }
}
