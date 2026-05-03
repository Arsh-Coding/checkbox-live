const { redisClient } = require("./redis");

const REDIS_KEY = "checkboxes_bitmap";

async function setCheckbox(index, checked) {
  await redisClient.setBit(REDIS_KEY, index, checked ? 1 : 0);
}

async function getCheckbox(index) {
  return await redisClient.getBit(REDIS_KEY, index);
}

async function getAllChecked(totalCells) {
  const checked = [];
  for (let i = 0; i < totalCells; i++) {
    const bit = await redisClient.getBit(REDIS_KEY, i);
    if (bit === 1) checked.push(i);
  }
  return checked;
}

module.exports = {
  setCheckbox,
  getCheckbox,
  getAllChecked,
};