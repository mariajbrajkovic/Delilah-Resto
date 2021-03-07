-- Base de datos: `delilahresto`
DROP DATABASE IF EXISTS delilahresto;
CREATE DATABASE delilahresto;

-- Estructura de tabla para la tabla `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `user_id` INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT , 
    `fullname` VARCHAR(64) NOT NULL , 
    `username` VARCHAR(64) NOT NULL , 
    `email` VARCHAR(64) NOT NULL , 
    `phone` INT(15) NOT NULL , 
    `address` VARCHAR(64) NOT NULL , 
    `password` VARCHAR(64) NOT NULL ,
    `admin` TINYINT(1)
);

-- Volcado de datos para la tabla `users`
INSERT INTO `users` (`user_id`, `fullname`, `username`, `email`, `phone`, `address`, `password`, `admin`) VALUES
(1, 'John Doe', 'johndoe', 'john@google.com', 153426182, 'Collins Av. 3567', 'wonderful', 1),
(2, 'Jane Doe', 'janedoe', 'jane@google.com', 153428105, 'P Sherman 42', 'underthesea', 0);

-- Estructura de tabla para la tabla `products`
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `product_id` INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT , 
    `name` VARCHAR(64) NOT NULL , 
    `price` DECIMAL(10,2) NOT NULL , 
    `description` VARCHAR(168)
);

-- Volcado de datos para la tabla `products`
INSERT INTO `products` (`product_id`, `name`, `price`, `description`) VALUES
(1, 'Cheeseburger', 400, 'Delicious cheeseburger with special sauce'),
(2, 'Fries', 200, 'Crispy french fries'),
(3, 'Pizza', 300, 'Pizza margarita');

-- Estructura de tabla para la tabla `orders`
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `order_id` INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `date` DATETIME NOT NULL DEFAULT current_timestamp(),
    `status_id` INT(10) NOT NULL,
    `payment_id` INT(10) NOT NULL,
    `user_id` INT(10) NOT NULL,
    `delivery_address` VARCHAR(64) NOT NULL,
    `amount` INT(10) NOT NULL
);

-- Estructura de tabla para la tabla `payment_method`
DROP TABLE IF EXISTS `payment_method`;
CREATE TABLE `payment_method` ( 
    `payment_id` INT(10) NOT NULL PRIMARY KEY , 
    `payment_method` VARCHAR(64) 
);

-- Volcado de datos para la tabla `payment_method`
INSERT INTO `payment_method` (`payment_id`, `payment_method`) VALUES
(1, 'Efectivo'),
(2, 'Credito'),
(3, 'Debito');

-- AUTO_INCREMENT de la tabla `payment_method`
ALTER TABLE `payment_method`
  MODIFY `payment_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- Estructura de tabla para la tabla `order_details`
DROP TABLE IF EXISTS `order_details`;
CREATE TABLE `order_details` ( 
    `detail_id` INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT , 
    `order_id` INT(10) NOT NULL , 
    `product_id` INT(10) NOT NULL , 
    `quantity` INT(10) NOT NULL,
    `subtotal` DECIMAL(10,2) NOT NULL
);

-- Estructura de tabla para la tabla `status`
DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` ( 
    `status_id` INT(10) NOT NULL PRIMARY KEY , 
    `status` VARCHAR(64) NOT NULL
);

-- Volcado de datos para la tabla `status`
INSERT INTO `status` (`status_id`, `status`) VALUES
(1, 'Nuevo'),
(2, 'Confirmado'),
(3, 'Preparando'),
(4, 'Enviando'),
(5, 'Entregado'),
(6, 'Cancelado');

-- AUTO_INCREMENT de la tabla `status`
ALTER TABLE `status`
  MODIFY `status_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

-- Filtros para la tabla `orders`
ALTER TABLE `orders`
  ADD CONSTRAINT `method-order` FOREIGN KEY (`payment_id`) REFERENCES `payment_method` (`payment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `status-order` FOREIGN KEY (`status_id`) REFERENCES `status` (`status_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user-order` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Filtros para la tabla `order_details`
ALTER TABLE `order_details`
  ADD CONSTRAINT `order-detail` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product-detail` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;