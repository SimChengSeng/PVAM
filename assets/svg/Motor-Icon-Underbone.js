import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SVGComponent = (props) => (
  <Svg
    viewBox="0 0 250 190"
    width="100%"
    height="100%"
    right="15%"
    fill={props.fill || "#000"}
    {...props}
  >
    <Path
      d="M114 9c2.688-.312 2.688-.312 5 0 1.649 3.298.085 6.147-.984 9.531-1.373 3.338-3.262 5.174-6.016 7.469l-2.812 2.813L107 31l1 3 7 1v2l1.688.625c3.185 1.894 5.017 4.492 7.312 7.375l1.75 1.563c1.728 1.987 1.904 3.873 2.25 6.437-4.029 3.852-6.794 4.544-12.312 4.75l-3.801.172L109 58v2l2.938 1.813c2.603 2.017 3.032 3.025 3.648 6.335q.224 3.492.309 6.989C115.8 77.945 115.8 77.945 117 80a86 86 0 0 1 .375 5.938l.148 3.214C117 92 117 92 114.602 93.88 112 95 112 95 110 95c1.083 5.549 3.691 7.735 7.855 11.156 2.74 2.355 5.009 4.969 7.34 7.719 2.668 3.14 5.443 6.183 8.203 9.242 2.708 3.183 2.866 5.574 2.836 9.735-.361 3.314-1.908 6.11-3.234 9.148-.252 3.793-.252 3.793 0 7 7.738.323 14.924.53 22-3 2.635-2.635 2.329-3.952 2.375-7.625-.077-4.977-.8-8.27-3.309-12.527-1.074-1.861-1.755-3.628-2.441-5.66-1.235-3.505-2.941-6.543-4.812-9.75-2.402-4.359-4.001-7.388-2.813-12.438 2.63-4.223 4.346-5.552 9.14-6.852 7.842-1.25 15.268-1.23 23.137-.343 4.625.45 7.071.09 10.723-2.805l2.102-2.58c3.929-3.28 6.633-3.1 11.593-2.979l2.513.007q2.62.015 5.24.065c2.675.05 5.349.061 8.025.067q2.548.02 5.097.049l2.425.016c3.837.083 5.74.178 9.005 2.355 1.188 3.625 1.188 3.625 2 7h2l.813-1.812c1.26-2.323 2.08-3.594 4.187-5.188 2.91-.34 2.91-.34 6.418-.293l3.799.03c1.31.024 2.62.05 3.97.076q2.004.022 4.006.04 4.904.054 9.807.147l2 4c-2.5 3.09-4.569 3.522-8.437 4.063-3.597.513-6.393 1.131-9.563 2.937l.957 2.176c1.02 2.762 1.4 5.1 1.73 8.011.934 5.696 3.33 9.324 6.852 13.817C265 122 265 122 265 124h2c2.54 3.418 3.364 5.758 3 10-2.687.5-2.687.5-6 0-2.122-2.39-3.485-5.2-5-8a213 213 0 0 0-3.062-4.937l-1.41-2.278c-1.776-2.075-2.865-2.424-5.528-2.785l-1 3 2.246 1.207c2.918 1.9 4.666 3.757 6.816 6.48l1.973 2.45c4.693 6.839 6.61 12.024 6.402 20.363l.022 2.434c-.083 7.914-2.747 14.105-6.459 21.066l-1.258 2.414c-2.033 3.018-4.154 4.675-7.117 6.774l-2.836 2.042c-6.484 4.114-12.04 4.136-19.539 4.145l-3.172.074c-10.452.04-18.382-3.391-26.078-10.449-4.215-4.836-7-9.462-7-16h-2v-2a163 163 0 0 0-17.762 6.09c-9.296 3.78-18.176 5.271-28.175 5.285l-2.803.074c-8.466.036-16.398-1.989-22.697-7.949l-1.872-1.719c-3.945-4.155-5.064-6.84-5.879-12.594-1.435-8.708-5.33-15.683-9.812-23.187h-3c.963 3.934 1.796 6.681 4 10.125 4.687 7.894 4.593 17.887 2.965 26.656-2.408 8.033-7.043 16.15-14.29 20.668l-2.362 1.238c-2.845 1.397-2.845 1.397-5.313 3.313-10.619 3.314-21.732 2.917-31.937-1.562-9.067-4.96-16.596-12.282-19.609-22.365-2.404-10.975-2.031-22.954 3.823-32.698 2.008-2.768 4.083-5.379 6.438-7.86 1.525-1.635 1.525-1.635 2.535-4.64C47 114.359 51.243 112.989 56 111l3.063-1.375c4.113-.875 7.82-.302 11.937.375 1.612-2.954 1.612-2.954 2-6.25-1.025-2.818-2.197-4.372-4.062-6.687-1.989-2.564-2.891-3.838-3.563-7.063 1.552-7.45 5.546-12.39 10.723-17.824C78.08 69.908 79.5 67.607 81 65q1.427-2.101 2.875-4.187C87.055 56.09 89.575 51.14 92 46h2l.352-1.809C95 42 95 42 97.375 38.937c2.902-3.84 3.797-7.72 4.754-12.386 1.039-3.043 2.556-4.373 4.871-6.551l1-3 3-3 1.375-2.687zM59.75 132c-5.634 2.582-8.685 7.082-11.625 12.375-1.75 5.64-2.01 10.326.125 15.875L50 163l1.625 2.625c4.59 4.59 9.977 6.593 16.438 6.813 6.293-.294 10.993-1.79 15.812-5.875 4.91-5.922 5.179-12.02 5.125-19.563-.528-3.343-1.265-4.977-3-8-3.018-2.054-3.018-2.054-6-3l-2 2c.204 1.84.42 3.68.688 5.512 1.561 12.433 1.561 12.433-1.626 17.676-4.04 2.39-7.363 3.358-12.062 2.812-3.816-1.645-6.294-3.833-8.437-7.375-.951-4.437-1-8.314.437-12.625l2.875-.875c3.243-.871 3.243-.871 5.063-3.437 1.23-3.113 1.19-4.565.062-7.688-2.15-1.363-2.15-1.363-5.25 0M213 162c.564 2.048.564 2.048 2 4 3.06.816 3.06.816 6 1-2.312-2.562-2.312-2.562-5-5z"
      fill="#414143"
    />
    <Path
      d="M114 9c2.688-.312 2.688-.312 5 0 1.649 3.298.085 6.147-.984 9.531-1.373 3.338-3.262 5.174-6.016 7.469l-2.812 2.813L107 31l1 3 7 1v2l1.688.625c3.185 1.894 5.017 4.492 7.312 7.375l1.75 1.563c1.728 1.987 1.904 3.873 2.25 6.437-4.029 3.852-6.794 4.544-12.312 4.75l-3.801.172L109 58v2l2.938 1.813c2.603 2.017 3.032 3.025 3.648 6.335q.224 3.492.309 6.989C115.8 77.945 115.8 77.945 117 80a86 86 0 0 1 .375 5.938l.148 3.214C117 92 117 92 114.602 93.88 112 95 112 95 110 95c1.083 5.549 3.691 7.735 7.855 11.156 2.74 2.355 5.009 4.969 7.34 7.719 2.668 3.14 5.443 6.183 8.203 9.242 2.655 3.121 2.929 5.504 2.899 9.594-.442 3.407-1.84 6.172-3.34 9.234-1.08 2.317-1.63 4.522-1.957 7.055a215 215 0 0 1-3.883-6.04C115.42 124.15 97.63 106.82 76 100l1 2-2 2a369 369 0 0 1-4.5-5.125l-2.531-2.883C65.717 92.57 65.476 91.01 66 87c1.76-5.984 5.88-10.396 10.098-14.824C78.08 69.908 79.5 67.607 81 65q1.427-2.101 2.875-4.187C87.055 56.09 89.575 51.14 92 46h2l.352-1.809C95 42 95 42 97.375 38.937c2.902-3.84 3.797-7.72 4.754-12.386 1.039-3.043 2.556-4.373 4.871-6.551l1-3 3-3 1.375-2.687z"
      fill={props.fill || "#000"}
    />
    <Path
      d="m200.695 82.441 2.513.007q2.62.015 5.24.065c2.675.05 5.349.061 8.025.067q2.548.02 5.097.049l2.425.016c3.837.083 5.74.178 9.005 2.355 1.188 3.625 1.188 3.625 2 7h2l.813-1.812c1.26-2.323 2.08-3.594 4.187-5.188 2.91-.34 2.91-.34 6.418-.293l3.799.03c1.31.024 2.62.05 3.97.076q2.004.022 4.006.04 4.904.054 9.807.147l2 4c-1.717 2.17-2.578 2.94-5.363 3.336l-2.95.039c-4.284.211-8.104.656-12.242 1.793-11.203 3.063-20.985 3.941-32.508 3.48-12.933-.487-22.15-.213-32.164 8.887l-1.813 1.723c-3.64 3.235-7.76 5.782-11.835 8.43l-2.33 1.565c-5.41 3.619-5.41 3.619-8.795 4.747v6c9.977 5.215 21.997 4.176 33 4.5 8.698.256 17.335.683 26 1.5-4.422 5.658-9.592 6.683-16.375 8.375a3172 3172 0 0 0-6.738 1.785l-3.46.91c-6.32 1.714-12.562 3.676-18.813 5.62A762 762 0 0 1 168 154l-2.074.629c-5.313 1.487-10.426 1.738-15.926 1.746l-2.578.074c-6.203.029-10.083-1.282-15.422-4.449-1-1-1-1-1.062-4.562L131 144h1l1 5c7.738.323 14.924.53 22-3 2.635-2.635 2.329-3.952 2.375-7.625-.077-4.977-.8-8.27-3.309-12.527-1.074-1.861-1.755-3.628-2.441-5.66-1.235-3.505-2.941-6.543-4.812-9.75-2.402-4.359-4.001-7.388-2.813-12.438 2.63-4.223 4.346-5.552 9.14-6.852 7.842-1.25 15.268-1.23 23.137-.343 4.625.45 7.071.09 10.723-2.805l2.102-2.58c3.929-3.28 6.633-3.1 11.593-2.979"
      fill="#3F3331"
    />
    <Path
      d="M77.89 102.246c2.473.884 3.918 2.061 5.86 3.817l1.86 1.66L87 109l-.734 2.26c-1.1 3.41-2.184 6.825-3.266 10.24l-1.156 3.555C78.542 135.427 78.542 135.427 80 146c1.044 10.465 1.044 10.465-2.125 15.125-4.03 2.628-7.028 3.913-11.875 3.813-4.7-1.47-7.902-4.042-10.375-8.313-.808-3.394-1.004-6.148-.625-9.625 1.857-2.453 3.352-3.695 6.125-5 2.466-1.315 3.042-2.35 3.875-5-.304-2.69-.304-2.69-1-5-5.788 1.516-10.069 3.93-13.266 9.012-2.622 5.29-3.643 10.121-2.734 15.988 2.18 5.967 5.692 9.688 11.188 12.813 6.944 2.162 13.409 1.97 20.124-.887C81.658 167.64 83.29 166.039 85 164l2-2c3.331-4.997 3.716-10.1 3-16-1.281-3.666-2.846-6.87-5.637-9.602C83 135 83 135 83 133c2.897-1.684 5.191-2.94 8.563-3.187 4.742 2.31 6.601 7.396 8.75 12 2.14 9.927.49 18.754-4.668 27.48C90.14 177.158 83.428 181.252 74 183c-10.132 1.098-18.315-.76-26.312-7.187-6.875-6.472-10.878-15.39-11.25-24.813.178-9.173 3.843-16.889 9.937-23.625 4.455-3.898 8.498-6.44 14.508-6.633 3.458.421 6.05 1.626 9.117 3.258l.113-1.723c.338-3.966.751-7.398 2.45-11.027 1.381-3.124 1.741-4.901 1.437-8.25 2-1 2-1 3.89-.754"
      fill="#413534"
    />
    <Path
      d="m262 92-8 4 .5 1.5c.712 3.562 1.212 6.922.5 10.5-2.144 1.99-3.584 2.978-6.125 4.25l-1.987 1.089q-2.201 1.2-4.422 2.36c-2.682 1.415-5.328 2.884-7.974 4.364-5.467 3.04-10.94 6.054-16.492 8.937l-2.673 1.455c-7.126 3.626-13.088 4.234-21.014 3.982l-3.435-.059c-24.543-.582-24.543-.582-29.878-5.378.085-2.687.085-2.687 1-6a49 49 0 0 1 6.633-5.004l2.03-1.35a622 622 0 0 1 6.462-4.209q2.145-1.41 4.29-2.826a931 931 0 0 1 6.091-3.997l1.87-1.214 1.83-1.18c1.822-1.206 1.822-1.206 3.555-2.624 4.275-3.384 6.968-4.17 12.587-3.909q2.12.065 4.243.127l2.214.094c14.108.573 26.543-.552 40.185-4.44 2.698-.629 5.255-.646 8.01-.468"
      fill={props.fill || "#000"}
    />
    <Path
      d="M240.813 122.313c8.942 4.734 14.932 12.15 18.187 21.687 1.128 9.156-.408 17.547-5.508 25.29-4.694 5.829-11.018 10.355-18.492 11.71-9.367.771-17.091.595-25-5-2.875-2.5-2.875-2.5-5-5l-2.187-2.375c-2.212-3.203-2.925-5.853-3.813-9.625h-14c2.9-2.174 5.636-4.048 8.73-5.883l2.682-1.597 2.775-1.645q2.742-1.627 5.481-3.258l2.446-1.45c1.825-1.03 1.825-1.03 2.886-2.167l3.25-.312c4.11-.754 5.719-1.917 8.75-4.688 4.19-2.095 8.363-1.194 12.688.125 3.948 2.235 5.406 3.759 7.312 7.875.893 5.66.226 10.161-3 15-4.173 3.782-8.266 4.39-13.727 4.363-2.575-.411-3.562-1.057-5.46-2.8-3.087-2.813-4.727-3.271-8.813-3.563 2.736 4.816 5.559 8.213 11 10 7.085 1.036 13.147.261 19-4 4.13-4.238 5.799-7.952 6.375-13.812-.187-6.2-2.855-10.598-7.062-15-3.945-2.606-7.78-3.95-12.313-5.188a279 279 0 0 1 5-5l2.438-2.437C238 122 238 122 240.813 122.313"
      fill="#3F3332"
    />
    <Path
      d="M255 101h1l.191 2.055c.922 7.004 2.996 11.398 7.348 16.949C265 122 265 122 265 124h2c2.54 3.418 3.364 5.758 3 10-2.687.5-2.687.5-6 0-2.122-2.39-3.485-5.2-5-8a213 213 0 0 0-3.062-4.937l-1.41-2.278c-1.776-2.075-2.865-2.424-5.528-2.785l-1 3 2.246 1.207c2.918 1.9 4.666 3.757 6.816 6.48l1.973 2.45c4.693 6.839 6.61 12.024 6.402 20.363l.022 2.434c-.083 7.914-2.747 14.105-6.459 21.066l-1.258 2.414c-2.033 3.018-4.154 4.675-7.117 6.774l-2.836 2.042c-6.484 4.114-12.04 4.136-19.539 4.145l-3.172.074c-10.452.04-18.382-3.391-26.078-10.449-4.215-4.836-7-9.462-7-16l-2-1h2v-2h7c5 10 5 10 5.914 12.203 1.387 2.295 2.643 2.756 5.086 3.797.677.425 1.354.85 2.05 1.29 8.142 4.808 16.746 5.187 25.887 3.01 8.533-3.08 14.203-8.15 18.063-16.3 2.808-7.16 3.375-14.865.938-22.195-3.743-8.116-8.443-12.936-15.875-17.68-5.18-.211-8.382 3.521-12.063 6.875l4 2-3.875.375c-3.473.315-3.473.315-6.125 2.625-3.187.266-3.187.266-7 .25l-3.812.016C209 135 209 135 207 133l1.626-.743c12.508-5.752 24.572-11.95 36.357-19.071a94 94 0 0 1 4.075-2.262c1.694-.89 3.325-1.9 4.942-2.924 1.057-3.631 1.057-3.631 1-7"
      fill="#787668"
    />
    <Path
      d="M74 105c1.242 3.726.548 4.792-.875 8.375C71.73 116.917 70.642 120.243 70 124l-2.937-1.062c-5.494-1.504-10.23-1.326-15.391 1.203C44.474 128.988 40.728 135.985 38 144c-1.704 10.293.96 18.833 6.75 27.313C49.109 176.76 55.166 180.554 62 182c10.956.892 20.338-.617 28.953-7.766 6.776-7.396 9.424-16.499 9.332-26.285-.69-7.137-4.094-13.26-8.285-18.949l5-2c7.099 11.597 10.525 21.992 7.965 35.781-2.408 8.033-7.043 16.15-14.29 20.668l-2.362 1.238c-2.845 1.397-2.845 1.397-5.313 3.313-10.619 3.314-21.732 2.917-31.937-1.562-9.067-4.96-16.596-12.282-19.609-22.365-2.404-10.975-2.031-22.954 3.823-32.698 2.008-2.768 4.083-5.379 6.438-7.86 1.525-1.635 1.525-1.635 2.535-4.64C47 114.359 51.243 112.989 56 111l3.063-1.375c4.113-.875 7.82-.302 11.937.375z"
      fill="#7C7A6D"
    />
    <Path
      d="M86 110c3.118.578 4.779 1.396 7.023 3.625l1.647 1.628L96.375 117l1.755 1.784c7.549 7.816 13.69 15.995 14.12 27.153.598 7.79 6.048 12.72 11.688 17.625 1.01.805 2.02 1.61 3.062 2.438-1.746.7-1.746.7-4 1-2.035-1.293-2.035-1.293-4.062-3.187l-2.036-1.856c-4.093-4.211-5.255-6.877-6.09-12.77-1.435-8.708-5.33-15.683-9.812-23.187-3.728.711-6.772 2.32-10.125 4.063C85.221 133 85.221 133 83 133l1.242 1.574c5.229 6.767 7.75 11.74 6.758 20.426-.804 2.807-1.828 5.313-3 8-1.162-3.487-.81-5.556-.375-9.187.503-5.928.317-9.615-2.625-14.813-2.561-1.5-4.065-2-7-2 2.11-9.212 4.917-18.08 8-27"
      fill={props.fill || "#000"}
    />
    <Path
      d="m68 129-.437 3.219L67 136.5l-.29 2.11c-.626 4.837-.798 9.512-.71 14.39l5 1 .805-2.012L77 139c3.247 6.278 3.835 11.98 3 19-2.896 4.26-5.982 5.976-11 7-5.43-.113-8.213-2.213-12-6-2.275-3.93-2.49-7.513-2-12 1.857-2.453 3.352-3.695 6.125-5 2.466-1.315 3.042-2.35 3.875-5-.304-2.69-.304-2.69-1-5h-5c3.131-2.783 4.873-3.164 9-3"
      fill="#7B796C"
    />
    <Path
      d="M235 132c5.574 2.734 9.324 6.967 12.313 12.375 1.661 6.345 1.103 11.141-2.043 16.8-3.11 4.468-7.122 7.11-12.27 8.825-2.79.3-2.79.3-5.625.313l-2.852.05C222 170 222 170 220.164 168.605 219 167 219 167 219 165l-8-4v-2c2.625-.312 2.625-.312 6 0a301 301 0 0 1 4.3 3.875c3.31 2.19 6.918 1.735 10.7 1.125 3.885-1.295 5.498-2.297 7.875-5.625 1.762-5.287 2.007-9.988.063-15.25-3.505-3.843-7.44-4.941-12.5-5.562-4.38.557-7.314 2.313-10.438 5.437-1.666.04-3.334.043-5 0a116 116 0 0 1 5-5l1.762-1.668c5.173-4.418 9.501-5.645 16.238-4.332"
      fill="#F6F5F5"
    />
    <Path
      d="m81 65 18 1c-4.234 5.378-8.89 9.534-14.254 13.777-2.471 2-4.756 4.098-7.058 6.285-2.725 2.439-3.403 2.902-7.188 3.376L68 89c3.648 7.124 3.648 7.124 9 13l-2 2a369 369 0 0 1-4.5-5.125l-2.531-2.883C65.717 92.57 65.476 91.01 66 87c1.76-5.984 5.88-10.396 10.098-14.824C78.392 69.68 78.392 69.68 81 65"
      fill="#A9C4BA"
    />
    <Path
      d="M255 101h1l.191 2.055c.922 7.004 2.996 11.398 7.348 16.949C265 122 265 122 265 124h2c2.54 3.418 3.364 5.758 3 10-3.787-1.465-5.071-3.28-7.016-6.79l-1.601-2.85-1.633-2.985-1.68-3.008q-2.05-3.675-4.07-7.367c-3.942 1.847-6.99 4.406-10.25 7.25-4.786 4.119-9.635 8.04-14.75 11.75l4 2-3.875.375c-3.473.315-3.473.315-6.125 2.625-3.187.266-3.187.266-7 .25l-3.812.016C209 135 209 135 207 133l1.626-.743c12.508-5.752 24.572-11.95 36.357-19.071a94 94 0 0 1 4.075-2.262c1.694-.89 3.325-1.9 4.942-2.924 1.057-3.631 1.057-3.631 1-7"
      fill="#95999C "
    />
    <Path
      d="M234.688 138.125c3.948 2.235 5.406 3.759 7.312 7.875.893 5.66.226 10.161-3 15-4.165 3.775-8.252 4.39-13.703 4.363-3.872-.612-5.638-2.568-8.297-5.363v-1l2.957-.113 3.856-.2 3.832-.175c3.268-.255 3.268-.255 5.28-1.805 1.295-2.056 1.477-3.288 1.45-5.707l.023-2.062c-.543-2.645-1.145-3.425-3.398-4.938-3.422-.582-3.422-.582-7.187-.687l-3.856-.2L217 143c5.86-6.015 9.288-7.438 17.688-4.875"
      fill="#7D7B6D"
    />
    <Path
      d="M74 105c1.242 3.726.548 4.792-.875 8.375C71.73 116.917 70.642 120.243 70 124l-2.562-.621C61.294 121.919 55.286 120.616 49 120v-6a423 423 0 0 1 7-3l2.875-1.25c4.217-1.012 7.886-.447 12.125.25z"
      fill={props.fill || "#000"}
    />
    <Path
      d="M107.832 43.817c2.37.109 4.737.225 7.105.37l2.499.096 2.404.135 2.199.118c2.475.586 3.402 1.482 4.961 3.464.687 2.688.687 2.688 1 5-3.255 2.17-3.722 2.217-7.379 1.828l-2.54-.265-2.644-.313-2.654-.266c-6.522-.723-6.522-.723-8.783-2.984-.25-2.5-.25-2.5 0-5 2-2 2-2 3.832-2.183"
      fill="#413532"
    />
    <Path
      d="M114 9c2.688-.312 2.688-.312 5 0 1.649 3.298.085 6.147-.984 9.531-1.373 3.338-3.262 5.174-6.016 7.469-4.206 3.998-4.206 3.998-7 9h-2c-.92-4.69-1.36-7.75 1-12a102 102 0 0 1 3-3l1-3 3-3 1.375-2.687z"
      fill="#3C3232"
    />
    <Path
      d="M86 110c3.118.578 4.779 1.396 7.023 3.625l1.647 1.628L96.375 117l1.755 1.784c7.549 7.816 13.69 15.995 14.12 27.153.598 7.79 6.048 12.72 11.688 17.625 1.01.805 2.02 1.61 3.062 2.438-1.746.7-1.746.7-4 1-2.035-1.293-2.035-1.293-4.062-3.187l-2.036-1.856c-4.093-4.211-5.255-6.877-6.09-12.77-1.01-5.968-2.82-10.983-5.687-16.312l-.993-1.863c-3.032-5.371-7.109-9.241-11.757-13.2l-1.727-1.48c-1.821-1.514-1.821-1.514-4.648-3.332z"
      fill="#D5CFC3"
    />
    <Path
      d="M116 80h1c.135 1.936.232 3.874.313 5.813l.175 3.269C117 92 117 92 114.605 93.887 112 95 112 95 110 95v5l-1-4-5.86.098C101 96 101 96 99.157 95.5c-2.992-.694-5.84-.593-8.906-.562l-3.547.027L84 95c2.291-3.192 4.96-3.631 8.701-4.28l2.237-.345 2.284-.378A184 184 0 0 1 116 88z"
      fill="#95999C "
    />
    <Path
      d="m187.75 158.875 2.422.055L192 159v2l-2.812-.312c-4.688-.029-8.258 2.049-12.391 4.07-3.87 1.718-7.65 2.44-11.797 3.242l-1 1c-6.848 1.858-13.176 2.308-20.25 2.25l-2.93.023c-8.642-.023-8.642-.023-12.82-2.273v-2l2.744.095c26.043 1.04 26.043 1.04 50.408-7.282 2.31-1.017 4.087-1.012 6.598-.938"
      fill="#F3ECDD"
    />
    <Path
      d="M252 110c4.35 1.45 5.387 4.784 7.438 8.625l2.308 4.227 1.129 2.086c1.663 3.047 3.392 6.054 5.125 9.062-2.242-.07-2.242-.07-5-1-1.61-2.305-2.87-4.391-4.125-6.875-2.705-5.623-2.705-5.623-6.875-10.125-2.039.176-2.039.176-4 1l-3 1c1.488-3.787 3.62-5.774 7-8"
      fill="#CBCBCB"
    />
    <Path
      d="M255 101h1l.191 2.055c.922 7.004 2.996 11.398 7.348 16.949C265 122 265 122 265 124h2c2.54 3.418 3.364 5.758 3 10-5.697-2.245-7.856-7.535-10.875-12.562l-1.875-2.924c-4.879-8.1-4.879-8.1-3.633-13.729.73-2.218.73-2.218 1.383-3.785"
      fill="#3C3332"
    />
    <Path
      d="M57 145h2l-.07 2.047-.055 2.703-.07 2.672c.209 2.758.684 4.277 2.195 6.578 4.046 2.697 7.254 2.432 12 2 2.93-.867 2.93-.867 5-2-1 3-1 3-4 5-3.979 1.256-7.461 1.738-11.297-.102-3.809-2.71-6.776-5.145-7.703-9.898-.25-3.687-.25-3.687 0-7z"
      fill="#DEDEDD"
    />
    <Path
      d="M144 99h1l.813 2.813c.894 3.101.894 3.101 2.606 4.557 3.448 3.555 4.888 8.808 6.768 13.317l1.405 3.225C159.102 128.9 160.605 133.5 160 140c-1.514-2.876-2.644-5.737-3.687-8.812-1.723-4.812-3.716-9.436-5.875-14.063l-.888-1.91c-1.299-2.746-2.647-5.372-4.253-7.953-1.652-2.88-1.525-4.998-1.297-8.262"
      fill="#C9C8C8"
    />
    <Path
      d="M192 162c2.068 2.686 3.902 5.433 5.688 8.313 6.067 9.034 13.18 13.023 23.312 16.687v1c-6.74.87-12.934-3.064-18.25-6.812-5.064-3.996-8.894-8.946-10.75-15.188z"
      fill="#D6D6D4"
    />
    <Path
      d="M31 141h2l-.176 3.516c-.439 12.471.816 21.778 9.301 31.547A189 189 0 0 0 46 180l1.742 1.746L49 183c-3.68-.112-5.783-1.36-8.437-3.75-9.54-10.418-10.255-20.642-9.774-34.113q.098-2.07.211-4.137"
      fill="#D5D5D2"
    />
    <Path
      d="M86 110c3.118.578 4.779 1.396 7.023 3.625l1.648 1.63L96.375 117l1.749 1.766c4.244 4.375 7.865 8.913 10.876 14.234l-1 2c-3-1-3-1-3.992-2.672l-.883-2.078c-1.833-3.887-3.871-6.375-7.125-9.25l-1.77-1.566c-2.672-2.335-5.27-4.461-8.23-6.434z"
      fill="#F9F0E0"
    />
    <Path
      d="M79 134c3.835.22 4.942.94 7.688 3.75 4.07 5.72 5.105 10.31 4.312 17.25-.804 2.807-1.828 5.313-3 8-1.162-3.487-.81-5.556-.375-9.187.503-5.928.317-9.615-2.625-14.813-2.561-1.5-4.065-2-7-2z"
      fill="#CAC8C8"
    />
    <Path
      d="m252 110 3 1c1.688 3.563 1.688 3.563 3 7h-4l-2-2c-1.985.267-1.985.267-4 1l-3 1c1.488-3.787 3.62-5.774 7-8"
      fill="#DCDAD5"
    />
    <Path
      d="M74 116c2.625.375 2.625.375 5 1v6h-6c-.625-2.375-.625-2.375-1-5z"
      fill="#E1633D"
    />
    <Path
      d="M66 87h2l.7 2.012c2.026 5.487 3.786 9.227 8.3 12.988l-2 2a369 369 0 0 1-4.5-5.125l-2.531-2.883C65.757 92.631 65.579 90.938 66 87"
      fill="#CECABE"
    />
    <Path
      d="M106 134c2.568.942 3.774 1.62 5.188 4 .973 3.595 1.294 7.085 1.566 10.793.122 2.246.122 2.246 1.246 4.207l-2 3c-.182-1.002-.364-2.003-.55-3.035l-.763-4.028-.357-1.99c-.894-4.654-2.333-8.646-4.33-12.947"
      fill="#B8B2A6"
    />
    <Path
      d="M98 120c5.057 3.42 7.835 7.91 11 13l-1 2c-3-1-3-1-4.062-2.742l-.938-2.133c-1.03-2.326-1.786-3.918-3.625-5.695C98 123 98 123 98 120"
      fill="#D9D3C7"
    />
    <Path
      d="M79 134c3.923.224 4.961.96 7.75 3.875C89 141 89 141 90 144l-2 3-.48-1.68c-1.416-4.745-1.416-4.745-5.082-7.82-2.35-.567-2.35-.567-4.438-.5z"
      fill="#BFBCB7"
    />
    <Path
      d="M192 162c2.305 2.962 4.276 6.022 6.188 9.25l1.605 2.703L201 176h-4a486 486 0 0 1-2.5-4.75l-1.406-2.672C192 166 192 166 192 162"
      fill="#D6D6D4"
    />
    <Path
      d="m68 129-1 11h-2v-7c-2-1-3.831-1.494-6-2 3.462-2.052 4.594-2 9-2"
      fill="#C9C7C7"
    />
    <Path
      d="M37 172h2c1.621 1.645 1.621 1.645 3.438 3.813 2.107 2.498 4.214 4.911 6.562 7.187-4.98-.15-7.322-2.881-10.645-6.21C37 175 37 175 37 172"
      fill="#CFCFCD"
    />
    <Path
      d="M211 159c2.75-.25 2.75-.25 6 0 2.375 2 2.375 2 4 4l-1 3-1.687-1.375c-2.366-1.662-4.603-2.646-7.313-3.625z"
      fill="#EAE9E9"
    />
    <Path
      d="m221 135 2 1c-1.257 3.772-2.712 4.833-6 7-2.812.25-2.812.25-5 0 2.853-2.932 5.65-5.643 9-8"
      fill="#E7E4E1"
    />
    <Path
      d="M102 29h1v6h2l1-2v3c-2.626 1.845-4.951 2.984-8 4q.713-2.47 1.438-4.937l.808-2.778C101 30 101 30 102 29"
      fill="#B7A978"
    />
    <Path
      d="M192 159v2l-3.125-.187c-4.166.201-6.236 1.288-9.875 3.187-2.875.188-2.875.188-5 0 5.182-5.182 11.077-5.424 18-5"
      fill="#F7F2E8"
    />
    <Path
      d="M127.188 127.375 129 128c-.75 1.938-.75 1.938-2 4-2.125.75-2.125.75-4 1l-1-4c3-2 3-2 5.188-1.625M113 112c2.063.438 2.063.438 4 1v3c-3 2-3 2-5.187 1.625L110 117c1.875-3.875 1.875-3.875 3-5"
      fill="#B66A04"
    />
    <Path
      d="M144 99h1l.813 2.813c.889 3.15.889 3.15 2.812 4.624 2.257 2.565 1.56 5.305 1.375 8.563-6.596-9.894-6.596-9.894-6-16"
      fill="#C3C3C2"
    />
    <Path
      d="M123 121c-.75 1.938-.75 1.938-2 4-2.125.75-2.125.75-4 1v-5c2.49-1.245 3.41-.777 6 0"
      fill="#B66904"
    />
    <Path
      d="m262 92-1.687.813c-2.406 1.163-2.406 1.163-4.75 2.937C253 97 253 97 250.188 96.188L248 95c4.816-2.58 8.528-3.124 14-3"
      fill="#C6C3BC"
    />
    <Path
      d="M255 101h1l.402 2.336.536 3.039.527 3.023c.412 2.571.412 2.571 1.535 4.602-1.875-.25-1.875-.25-4-1-1.25-2.062-1.25-2.062-2-4l1-1q.553-3.493 1-7"
      fill="#433022"
    />
    <Path
      d="m48 115 3 1c-2.071 4.034-3.966 5.929-8 8l.938-2.312A111 111 0 0 0 46 116z"
      fill="#CCAE72"
    />
    <Path
      d="m110 22 3 3c-4.75 4.875-4.75 4.875-7 6 .53-3.821 1.497-6.062 4-9"
      fill="#BEBDBD"
    />
    <Path
      d="M208 183c4.609.72 8.672 2.313 13 4v1c-4.927.462-8.507-1.172-13-3z"
      fill="#C3C3C1"
    />
    <Path
      d="M76 159h2c-1 3-1 3-4 5-3.687-.375-3.687-.375-7-1v-1l1.715-.402 2.222-.536 2.215-.527C75 160.161 75 160.161 76 159"
      fill="#CDCDCA"
    />
    <Path
      d="M157 129c1.5 1 1.5 1 3 3 .273 2.718.135 5.257 0 8-1.737-3.225-2.89-6.513-4-10z"
      fill="#C5C4C4"
    />
    <Path d="M263 128h2l3 6-5-1z" fill="#DADADA" />
    <Path d="M150 111c2.503 2.938 3.47 5.179 4 9l-3-1z" fill="#DAD9D9" />
  </Svg>
);
export default SVGComponent;
