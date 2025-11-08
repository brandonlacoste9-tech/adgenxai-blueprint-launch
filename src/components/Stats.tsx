const stats = [
  {
    value: "10M+",
    label: "Ads Generated",
  },
  {
    value: "250%",
    label: "Average ROI Increase",
  },
  {
    value: "5,000+",
    label: "Happy Customers",
  },
  {
    value: "98%",
    label: "Customer Satisfaction",
  },
];

const Stats = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-primary to-accent text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-lg opacity-90">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
