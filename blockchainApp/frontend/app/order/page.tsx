"use client";

import { useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Text,
  Title,
  Alert,
  Container,
  Badge,
} from "@mantine/core";
import { IconCubePlus, IconUser } from "@tabler/icons-react";
import { OrderWithCounter } from "@opensea/seaport-js/lib/types";
import { Seaport } from "@opensea/seaport-js";
import { Web3SignerContext } from "@/context/web3.context";
import { ethers } from "ethers";
import { ethers as ethersV5 } from "ethersV5";

export default function SellOrders() {
  const { signer } = useContext(Web3SignerContext);
  const [sellOrders, setSellOrders] = useState<Array<OrderWithCounter>>([]);
  const [mySeaport, setMySeaport] = useState<Seaport | null>(null);
  const [alert, setAlert] = useState<{
    color: string;
    title: string;
    message: string;
  } | null>(null);

  const fetchSellOrders = async () => {
    const resp = await fetch("/api/order", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const datas = await resp.json();
    console.log(datas);
    setSellOrders(datas);
  };

  useEffect(() => {
    fetchSellOrders();
  }, []);

  // Seaport 初期化
  const seaportAddress = "0x4A679253410272dd5232B3Ff7cF5dbB88f295319";
  useEffect(() => {
    const setupSeaport = async () => {
      if (!signer) return;

      const { ethereum } = window as any;
      const ethersV5Provider = new ethersV5.providers.Web3Provider(ethereum);
      const ethersV5Signer = await ethersV5Provider.getSigner();

      const seaport = new Seaport(ethersV5Signer, {
        overrides: {
          contractAddress: seaportAddress,
        },
      });
      setMySeaport(seaport);
    };
    setupSeaport();
  }, [signer]);

  // NFT購入処理
  const buyNft = async (index: number, order: OrderWithCounter) => {
    try {
      const { executeAllActions } = await mySeaport!.fulfillOrders({
        fulfillOrderDetails: [{ order }],
        accountAddress: await signer?.getAddress(),
      });

      const transaction = await executeAllActions();
      console.log(transaction); // For debugging

      // 売り注文削除
      const query = new URLSearchParams({ id: index.toString() });
      await fetch("/api/order?" + query, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      setAlert({
        color: "teal",
        title: "Success buy NFT",
        message: "Now you own the NFT!",
      });

      fetchSellOrders();
    } catch (error) {
      setAlert({
        color: "red",
        title: "Failed to buy NFT",
        message: (error as { message: string }).message,
      });
    }
  };

  return (
    <div>
      <Title order={1} style={{ paddingBottom: 12 }}>
        Sell NFT Orders
      </Title>

      {alert && (
        <Container py={8}>
          <Alert
            variant="light"
            color={alert.color}
            title={alert.title}
            withCloseButton
            onClose={() => setAlert(null)}
            icon={<IconCubePlus />}
          >
            {alert.message}
          </Alert>
        </Container>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }}>
        {sellOrders.map((order, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              <img
                src={`https://picsum.photos/seed/${index}/300/200`}
                height={160}
                alt="No image"
              />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>
                NFT #{order.parameters.offer[0].identifierOrCriteria}
              </Text>
              <Badge color="red" variant="light">
                tokenId: {order.parameters.offer[0].identifierOrCriteria}
              </Badge>
            </Group>

            <Group mt="xs" mb="xs">
              <IconUser size="2rem" stroke={1.5} />
              <Text size="md" c="dimmed">
                {order.parameters.consideration[0].recipient.slice(0, 6)}...
                {order.parameters.consideration[0].recipient.slice(-2)}
              </Text>
            </Group>

            <Group mt="xs">
              <Text fz="lg" fw={700}>
                Price:{" "}
                {ethers.formatEther(
                  BigInt(order.parameters.consideration[0].startAmount)
                )}{" "}
                ether
              </Text>
              <Button
                variant="light"
                color="red"
                mt="xs"
                radius="xl"
                style={{ flex: 1 }}
                onClick={() => buyNft(index, order)}
              >
                Buy this NFT
              </Button>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </div>
  );
}
