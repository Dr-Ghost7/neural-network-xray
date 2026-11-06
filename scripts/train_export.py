import json
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms

# 784 -> 64 -> 32 -> 10 Architecture
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(784, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 10)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = x.view(-1, 784)
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

def export_weights(model):
    def to_list(tensor):
        return [round(float(v), 5) for v in tensor.detach().cpu().numpy().flatten()]

    return {
        "architecture": [784, 64, 32, 10],
        "w1": to_list(model.fc1.weight), # shape (64, 784)
        "b1": to_list(model.fc1.bias),   # shape (64)
        "w2": to_list(model.fc2.weight), # shape (32, 64)
        "b2": to_list(model.fc2.bias),   # shape (32)
        "w3": to_list(model.fc3.weight), # shape (10, 32)
        "b3": to_list(model.fc3.bias),   # shape (10)
    }

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Standard MNIST transformation
    transform = transforms.Compose([
        transforms.ToTensor()
    ])

    data_dir = "./data"
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs("../public/weights", exist_ok=True)

    print("Loading MNIST dataset...")
    train_loader = torch.utils.data.DataLoader(
        datasets.MNIST(data_dir, train=True, download=True, transform=transform),
        batch_size=128, shuffle=True
    )
    test_loader = torch.utils.data.DataLoader(
        datasets.MNIST(data_dir, train=False, transform=transform),
        batch_size=1000, shuffle=False
    )

    model = Net().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.003)

    checkpoints = {}
    # Checkpoint 0: Random untrained
    checkpoints[0] = export_weights(model)

    epochs = 6
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0
        for data, target in train_loader:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        # Evaluate
        model.eval()
        correct = 0
        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(device), target.to(device)
                pred = model(data).argmax(dim=1, keepdim=True)
                correct += pred.eq(target.view_as(pred)).sum().item()

        acc = correct / len(test_loader.dataset) * 100
        print(f"Epoch {epoch}/{epochs} - Test Acc: {acc:.2f}%")

        if epoch in [1, 2, 4, epochs]:
            checkpoints[epoch] = export_weights(model)

    # Save final model weights
    final_weights = export_weights(model)
    final_path = "../public/weights/mnist_mlp_final.json"
    with open(final_path, "w") as f:
        json.dump(final_weights, f)
    print(f"Exported final weights to {final_path}")

    # Save checkpoints for timeline replay
    replay_path = "../public/weights/mnist_mlp_checkpoints.json"
    with open(replay_path, "w") as f:
        json.dump(checkpoints, f)
    print(f"Exported checkpoint replay to {replay_path}")

if __name__ == "__main__":
    main()
