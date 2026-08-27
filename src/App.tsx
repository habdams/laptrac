import { useState } from "react";
import { Box, Button } from "@chakra-ui/react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section>
        <Box bg="gray.200" p="4">
          <div>
            <h1>Get started</h1>
            <p>
              Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
            </p>
          </div>
          <Button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </Button>
        </Box>
      </section>
    </>
  );
}

export default App;
