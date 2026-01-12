import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart: React.FC = () => {
  const data = {
    labels: ["Base Score","MI Score","Vendor History", "Amount Anamoly","Frequency Anomaly"], // 5 data points
    datasets: [
      {
        label: "Transactions",
        data: [120, 190, 320, 250, 220], // 1 dataset
        backgroundColor: "rgba(0, 102, 255, 0.8)", // Blue color
         barThickness: 30,       
    maxBarThickness: 60,   
    borderRadius: 6,
   
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
