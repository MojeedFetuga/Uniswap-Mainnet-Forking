import { ethers } from "hardhat";
import { Contract } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Uniswap V3 Contract Addresses
const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const WETH_ADDRESS = "0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Wrapped ETH
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606eB48"; // USDC

const FEE_TIER = 3000; // 0.3% pool fee

async function main() {
  const [signer] = await ethers.getSigners();

  console.log(`Using signer: ${signer.address}`);

  // Attach to Uniswap V3 Router
  const router = new ethers.Contract(
    UNISWAP_V3_ROUTER,
    [
      "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external payable returns (uint256)"
    ],
    signer
  );

  // Get WETH and USDC contracts
  const tokenA = new ethers.Contract(WETH_ADDRESS, ["function approve(address,uint256) external returns (bool)"], signer);
  const tokenB = new ethers.Contract(USDC_ADDRESS, ["function approve(address,uint256) external returns (bool)"], signer);

  // Amounts to add (adjust based on the token decimals)
  const amountA = ethers.utils.parseEther("1"); // 1 WETH
  const amountB = ethers.utils.parseUnits("2000", 6); // 2000 USDC

  console.log("Approving tokens...");
  await tokenA.approve(UNISWAP_V3_ROUTER, amountA);
  await tokenB.approve(UNISWAP_V3_ROUTER, amountB);

  console.log("Adding liquidity...");

  const addLiquidityParams = {
    token0: WETH_ADDRESS,
    token1: USDC_ADDRESS,
    fee: FEE_TIER,
    recipient: signer.address,
    tickLower: -887220,
    tickUpper: 887220,
    amount0Desired: amountA,
    amount1Desired: amountB,
    amount0Min: 0,
    amount1Min: 0,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
  };

  const tx = await router.exactInputSingle(addLiquidityParams, { gasLimit: 500000 });
  await tx.wait();

  console.log("Liquidity added successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
