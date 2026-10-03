let currentDataset = null;


export const setCurrentDataset = (
  dataset
) => {

  currentDataset =
    dataset;

};


export const getCurrentDataset = () => {

  return currentDataset;

};


export const clearCurrentDataset = () => {

  currentDataset = null;

};