// src/components/Panels/DataVisualizationPanel.ts

import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { ChartType } from "chart.js";
import { DataVisualizationManager } from "../DataVisualizationManager";

export default (components: OBC.Components) => {
  const dataVisualizationManager =
    DataVisualizationManager.getInstance(components);

  // Available chart types
  const chartTypes: ChartType[] = ["doughnut", "pie", "bar", "polarArea"];

  // Function to create the element type chart
  const createElementTypeChart = (chartType: ChartType) => {
    dataVisualizationManager.createElementTypeChart(
      "elementTypesChart",
      chartType
    );
  };

  // Function to export the chart as an image
  const exportChart = () => {
    dataVisualizationManager.exportChartAsImage(
      "elementTypesChart",
      "element-types-chart"
    );
  };

  // Function to generate and display the report
  const generateReport = () => {
    const report = dataVisualizationManager.generateReport("elementTypesChart");
    alert(report); // For simplicity, we're using an alert. In a real app, you might want to use a modal or a dedicated panel.
  };

  return BUI.Component.create<BUI.Panel>(() => {
    return BUI.html`
      <bim-panel>
        <bim-panel-section label="Element Types Distribution" icon="mdi:chart-donut">
          <canvas id="elementTypesChart"></canvas>
        </bim-panel-section>
        <bim-panel-section>
          <div style="display: flex; gap: 5px; flex-wrap: wrap;">
            ${chartTypes.map(
              (type) => BUI.html`
              <bim-button 
                @click=${() => createElementTypeChart(type)} 
                label=${type.charAt(0).toUpperCase() + type.slice(1)}
                icon="mdi:chart-box-plus-outline"
                tooltip-title="Generate ${type} Chart"
                tooltip-text="Create a ${type} chart showing the distribution of element types in the model">
              </bim-button>
            `
            )}
          </div>
        </bim-panel-section>
        <bim-panel-section>
          <div style="display: flex; gap: 5px;">
            <bim-button 
              @click=${exportChart} 
              label="Export"
              icon="mdi:export-variant"
              tooltip-title="Export Chart"
              tooltip-text="Save the current chart as a PNG image">
            </bim-button>
            <bim-button 
              @click=${generateReport} 
              label="Report"
              icon="mdi:file-document-outline"
              tooltip-title="Generate Report"
              tooltip-text="Generate a simple text report of the element type distribution">
            </bim-button>
          </div>
        </bim-panel-section>
      </bim-panel>
    `;
  });
};
